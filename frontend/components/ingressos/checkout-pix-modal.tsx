'use client'

import { Button, Card, Input, Label } from '@heroui/react'
import { Copy, X } from 'lucide-react'
import { useState } from 'react'
import { ApiError, apiFetch } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import type { CheckoutResponse } from '@/types/eventos'

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

  const maxQtd = Math.min(limitePorCompra, disponiveis)
  const total = preco * quantidade

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
            onPress={onClose}
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
              Simulação PIX — copie o código ou confirme o pagamento para gerar seus
              ingressos.
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
              <Button
                variant="primary"
                className="flex-1"
                isDisabled={isLoading}
                onPress={() => void handleConfirmarPix()}
              >
                {isLoading ? 'Confirmando...' : 'Confirmar pagamento'}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 'done' ? (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Seus ingressos foram gerados. Você também pode vê-los em Meus ingressos.
            </p>
            <ul className="space-y-2">
              {ingressos.map((ingresso) => (
                <li
                  key={ingresso.id}
                  className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 font-mono text-sm text-emerald-200"
                >
                  {ingresso.codigo}
                </li>
              ))}
            </ul>
            <Button variant="primary" className="w-full" onPress={onClose}>
              Fechar
            </Button>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
