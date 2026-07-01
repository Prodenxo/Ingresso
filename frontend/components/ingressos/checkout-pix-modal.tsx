'use client'

import { Button, Card, Input, Label } from '@heroui/react'
import { Copy, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { IngressoQrCode } from '@/components/check-in/ingresso-qr-code'
import { ApiError, apiFetch } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import type { CheckoutResponse, PedidoStatusResponse } from '@/types/eventos'

interface CheckoutPixModalProps {
  loteId: string
  loteNome: string
  preco: number
  limitePorCompra: number
  disponiveis: number
  onClose: () => void
  onSuccess: () => void
}

export function CheckoutPixModal({
  loteId,
  loteNome,
  preco,
  limitePorCompra,
  disponiveis,
  onClose,
  onSuccess,
}: CheckoutPixModalProps) {
  const [quantidade, setQuantidade] = useState(1)
  const [step, setStep] = useState<'quantidade' | 'pix' | 'done'>('quantidade')
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null)
  const [ingressos, setIngressos] = useState<Array<{ id: string; codigo: string }>>(
    [],
  )
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAguardandoPagamento, setIsAguardandoPagamento] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const maxQtd = Math.min(limitePorCompra, disponiveis)
  const total = preco * quantidade
  const isPixReal = checkout?.gateway === 'inter-pix'

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [])

  function pararPolling() {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
    setIsAguardandoPagamento(false)
  }

  function iniciarPolling(pedidoId: string) {
    pararPolling()
    setIsAguardandoPagamento(true)

    pollingRef.current = setInterval(() => {
      void (async () => {
        try {
          const status = await apiFetch<PedidoStatusResponse>(
            `/pedidos/${pedidoId}/status`,
          )

          if (status.status === 'PAGO' && status.ingressos.length > 0) {
            pararPolling()
            setIngressos(status.ingressos)
            setStep('done')
            onSuccess()
          }
        } catch {
          // Mantém polling até expirar ou usuário fechar
        }
      })()
    }, 3000)
  }

  async function handleCheckout() {
    setError(null)
    setIsLoading(true)

    try {
      const result = await apiFetch<CheckoutResponse>(
        `/pedidos/lotes/${loteId}/checkout`,
        {
          method: 'POST',
          body: JSON.stringify({ quantidade }),
        },
      )
      setCheckout(result)
      setStep('pix')

      if (result.gateway === 'inter-pix') {
        iniciarPolling(result.pedidoId)
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro no checkout')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleConfirmarPix() {
    if (!checkout) return

    setError(null)
    setIsLoading(true)

    try {
      const result = await apiFetch<{
        ingressos: Array<{ id: string; codigo: string }>
      }>(`/pedidos/${checkout.pedidoId}/confirmar-pix`, {
        method: 'POST',
      })
      setIngressos(result.ingressos)
      setStep('done')
      onSuccess()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao confirmar pagamento')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopyPix() {
    if (!checkout?.pixCopiaCola) return
    await navigator.clipboard.writeText(checkout.pixCopiaCola)
  }

  function handleClose() {
    pararPolling()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <Card className="glass-panel w-full max-w-md rounded-2xl border-white/10 p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="checkout-title" className="text-lg font-medium text-white">
              {step === 'done' ? 'Compra confirmada' : 'Comprar ingresso'}
            </h2>
            <p className="text-sm text-zinc-400">{loteNome}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Fechar"
            onPress={handleClose}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        {error ? (
          <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {step === 'quantidade' ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min={1}
                max={maxQtd}
                value={String(quantidade)}
                onChange={(e) =>
                  setQuantidade(
                    Math.min(maxQtd, Math.max(1, Number(e.target.value) || 1)),
                  )
                }
              />
              <p className="text-xs text-zinc-500">
                Máximo {maxQtd} por compra · {formatCurrency(preco)} cada
              </p>
            </div>
            <p className="text-sm text-zinc-300">
              Total: <span className="font-medium text-white">{formatCurrency(total)}</span>
            </p>
            <Button
              variant="primary"
              className="w-full"
              isDisabled={isLoading}
              onPress={() => void handleCheckout()}
            >
              {isLoading ? 'Processando...' : 'Continuar para PIX'}
            </Button>
          </div>
        ) : null}

        {step === 'pix' && checkout ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              {isPixReal
                ? 'Pague com Pix no app do seu banco. Seus ingressos serão liberados automaticamente após a confirmação.'
                : 'Simulação PIX — copie o código ou confirme o pagamento para gerar seus ingressos.'}
            </p>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="break-all font-mono text-xs text-zinc-300">
                {checkout.pixCopiaCola}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onPress={() => void handleCopyPix()}>
                <Copy className="size-4" aria-hidden />
                Copiar PIX
              </Button>
              {isPixReal ? (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 text-sm text-indigo-200">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {isAguardandoPagamento ? 'Aguardando pagamento...' : 'Processando...'}
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="flex-1"
                  isDisabled={isLoading}
                  onPress={() => void handleConfirmarPix()}
                >
                  {isLoading ? 'Confirmando...' : 'Confirmar pagamento'}
                </Button>
              )}
            </div>
          </div>
        ) : null}

        {step === 'done' ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Seus ingressos foram gerados. Apresente o QR Code na entrada do evento.
            </p>
            <ul className="space-y-4">
              {ingressos.map((ingresso, index) => (
                <li
                  key={ingresso.id}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 text-center"
                >
                  {ingressos.length > 1 ? (
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-emerald-300/80">
                      Ingresso {index + 1} de {ingressos.length}
                    </p>
                  ) : null}
                  <IngressoQrCode codigo={ingresso.codigo} size={200} />
                  <p className="mt-3 font-mono text-sm text-emerald-200">
                    {ingresso.codigo}
                  </p>
                </li>
              ))}
            </ul>
            <p className="text-center text-xs text-zinc-500">
              Também disponível em Meus ingressos
            </p>
            <Button variant="primary" className="w-full" onPress={handleClose}>
              Fechar
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
