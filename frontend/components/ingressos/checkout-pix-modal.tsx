'use client'

import { Button, Card, Input, Label } from '@heroui/react'
import { Copy, FileText, Loader2, User, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { IngressoQrCodeResponsive } from '@/components/check-in/ingresso-qr-code-responsive'
import { ApiError, apiFetch, apiFetchBlob } from '@/lib/api-client'
import { getLinkIndicacaoSlug } from '@/lib/link-indicacao-storage'
import {
  formatCpf,
  formatTelefone,
  isValidCpf,
  type ParticipanteAdicionalForm,
  validarParticipantesAdicionais,
} from '@/lib/cpf'
import { formatCurrency } from '@/lib/utils'
import type { FormaPagamentoDisponivel } from '@/types/ingressos'
import type {
  CheckoutRequest,
  CheckoutResponse,
  PedidoStatusResponse,
} from '@/types/eventos'

interface CheckoutPixModalProps {
  loteId: string
  loteNome: string
  preco: number
  precoOriginal?: number
  descontoPercentual?: number | null
  limitePorCompra: number
  disponiveis: number
  formasPagamento?: FormaPagamentoDisponivel[]
  onClose: () => void
  onSuccess: () => void
}

function criarParticipanteVazio(): ParticipanteAdicionalForm {
  return { nome: '', cpf: '', telefone: '' }
}

export function CheckoutPixModal({
  loteId,
  loteNome,
  preco,
  precoOriginal,
  descontoPercentual,
  limitePorCompra,
  disponiveis,
  formasPagamento = ['PIX', 'BOLETO'],
  onClose,
  onSuccess,
}: CheckoutPixModalProps) {
  const { user } = useAuth()
  const usaCheckoutOnline = formasPagamento.includes('CHECKOUT')
  const [quantidade, setQuantidade] = useState(1)
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'BOLETO' | 'CHECKOUT'>(
    usaCheckoutOnline ? 'CHECKOUT' : 'PIX',
  )
  const [compradorCpf, setCompradorCpf] = useState('')
  const [participantesAdicionais, setParticipantesAdicionais] = useState<
    ParticipanteAdicionalForm[]
  >([])
  const [step, setStep] = useState<'quantidade' | 'pagamento' | 'done'>('quantidade')
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null)
  const [ingressos, setIngressos] = useState<
    Array<{ id: string; codigo: string; participanteNome: string }>
  >([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAguardandoPagamento, setIsAguardandoPagamento] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pdfAutoOpenedRef = useRef(false)

  const isGratuito = preco <= 0
  const maxQtd = isGratuito ? 1 : Math.min(limitePorCompra, disponiveis)
  const total = preco * quantidade

  useEffect(() => {
    if (isGratuito && quantidade !== 1) {
      setQuantidade(1)
    }
  }, [isGratuito, quantidade])
  const isPagamentoReal =
    checkout?.gateway === 'inter-pix' ||
    checkout?.gateway === 'inter-boleto' ||
    checkout?.gateway === 'infinitypay'
  const isModoSimulacao =
    checkout?.gateway === 'mock-pix' ||
    checkout?.gateway === 'mock-boleto' ||
    checkout?.gateway === 'mock-infinitypay'
  const isCheckoutOnline =
    checkout?.metodo === 'CHECKOUT' ||
    metodoPagamento === 'CHECKOUT' ||
    usaCheckoutOnline
  const isBoleto = checkout?.metodo === 'BOLETO' || metodoPagamento === 'BOLETO'

  useEffect(() => {
    const extras = Math.max(0, quantidade - 1)

    setParticipantesAdicionais((atual) => {
      const next = [...atual]

      while (next.length < extras) {
        next.push(criarParticipanteVazio())
      }

      return next.slice(0, extras)
    })
  }, [quantidade])

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
          // Mantém polling
        }
      })()
    }, 3000)
  }

  function atualizarParticipante(
    index: number,
    field: keyof ParticipanteAdicionalForm,
    value: string,
  ) {
    setParticipantesAdicionais((atual) =>
      atual.map((item, i) => {
        if (i !== index) return item

        if (field === 'cpf') {
          return { ...item, cpf: formatCpf(value) }
        }

        if (field === 'telefone') {
          return { ...item, telefone: formatTelefone(value) }
        }

        return { ...item, [field]: value }
      }),
    )
  }

  async function handleCheckout() {
    setError(null)

    if (quantidade > 1) {
      const erroValidacao = validarParticipantesAdicionais(participantesAdicionais)

      if (erroValidacao) {
        setError(erroValidacao)
        return
      }
    }

    if (metodoPagamento === 'BOLETO' && !isValidCpf(compradorCpf)) {
      setError('Informe um CPF válido para emitir o boleto')
      return
    }

    setIsLoading(true)

    try {
      const payload: CheckoutRequest = {
        quantidade,
        metodo: usaCheckoutOnline ? 'CHECKOUT' : metodoPagamento,
      }

      if (metodoPagamento === 'BOLETO') {
        payload.compradorCpf = compradorCpf
      }

      if (quantidade > 1) {
        payload.participantesAdicionais = participantesAdicionais.map((p) => ({
          nome: p.nome.trim(),
          cpf: p.cpf,
          telefone: p.telefone,
        }))
      }

      const linkSlug = getLinkIndicacaoSlug()
      if (linkSlug) {
        payload.linkIndicacaoSlug = linkSlug
      }

      const result = await apiFetch<CheckoutResponse>(
        `/pedidos/lotes/${loteId}/checkout`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      )

      if (result.gateway === 'gratuito' && result.ingressos?.length) {
        setIngressos(result.ingressos)
        setStep('done')
        onSuccess()
        return
      }

      setCheckout(result)
      setStep('pagamento')

      if (
        result.gateway === 'inter-pix' ||
        result.gateway === 'inter-boleto' ||
        result.gateway === 'infinitypay'
      ) {
        iniciarPolling(result.pedidoId)
      }

      if (result.gateway === 'infinitypay' && result.checkoutUrl) {
        window.location.assign(result.checkoutUrl)
        return
      }

      if (result.gateway === 'inter-boleto' && result.boletoPdfUrl) {
        pdfAutoOpenedRef.current = true
        void baixarBoletoPdf(result.pedidoId)
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
        ingressos: Array<{ id: string; codigo: string; participanteNome: string }>
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

  async function handleCopyLinhaDigitavel() {
    const linha = checkout?.linhaDigitavel ?? checkout?.pixCopiaCola
    if (!linha) return
    await navigator.clipboard.writeText(linha)
  }

  async function baixarBoletoPdf(pedidoId: string) {
    try {
      const blob = await apiFetchBlob(`/pedidos/${pedidoId}/boleto/pdf`)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao baixar boleto')
    }
  }

  async function handleBaixarBoletoPdf() {
    if (!checkout?.pedidoId) return
    await baixarBoletoPdf(checkout.pedidoId)
  }

  function handleClose() {
    pararPolling()
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <Card className="glass-panel max-h-[92vh] w-full overflow-y-auto rounded-t-2xl rounded-b-none border-white/10 p-5 sm:max-w-md sm:rounded-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id="checkout-title" className="text-lg font-medium text-white">
              {step === 'done'
                ? isGratuito
                  ? 'Ingresso confirmado'
                  : 'Compra confirmada'
                : isGratuito
                  ? 'Confirmar ingresso grátis'
                  : 'Comprar ingresso'}
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

        {isModoSimulacao && step === 'pagamento' ? (
          <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Modo simulação: pagamento mockado para testes locais. Confirme o
            pagamento para gerar os QR Codes dos ingressos.
          </p>
        ) : null}

        {step === 'quantidade' ? (
          <div className="space-y-4">
            {!isGratuito ? (
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
            ) : (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                Limite de <strong>1 ingresso grátis</strong> por e-mail neste lote.
              </p>
            )}

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-indigo-300/80">
                Ingresso 1: Seu ingresso
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm text-white">
                <User className="size-4 text-indigo-300" aria-hidden />
                {user?.nome ?? 'Sua conta'}
              </div>
              <p className="mt-1 text-xs text-zinc-400">{user?.email}</p>
            </div>

            {quantidade > 1 ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-300">
                  Preencha os dados dos outros {quantidade - 1} ingresso(s):
                </p>

                {participantesAdicionais.map((participante, index) => (
                  <div
                    key={index}
                    className="space-y-3 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm font-medium text-white">
                      Ingresso {index + 2}
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor={`nome-${index}`}>Nome completo</Label>
                      <Input
                        id={`nome-${index}`}
                        value={participante.nome}
                        onChange={(e) =>
                          atualizarParticipante(index, 'nome', e.target.value)
                        }
                        placeholder="Nome do participante"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`cpf-${index}`}>CPF</Label>
                      <Input
                        id={`cpf-${index}`}
                        value={participante.cpf}
                        onChange={(e) =>
                          atualizarParticipante(index, 'cpf', e.target.value)
                        }
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`telefone-${index}`}>Celular</Label>
                      <Input
                        id={`telefone-${index}`}
                        value={participante.telefone}
                        onChange={(e) =>
                          atualizarParticipante(index, 'telefone', e.target.value)
                        }
                        placeholder="(11) 99999-9999"
                        inputMode="tel"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Forma de pagamento</Label>
              {isGratuito ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  Ingresso gratuito — sem pagamento. Clique abaixo para confirmar.
                </div>
              ) : usaCheckoutOnline ? (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
                  Pix ou cartão de crédito (até 12x) via InfinitePay
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {formasPagamento.includes('PIX') ? (
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        metodoPagamento === 'PIX'
                          ? 'border-indigo-500/50 bg-indigo-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-400'
                      }`}
                      onClick={() => setMetodoPagamento('PIX')}
                    >
                      Pix
                    </button>
                  ) : null}
                  {formasPagamento.includes('BOLETO') ? (
                    <button
                      type="button"
                      className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                        metodoPagamento === 'BOLETO'
                          ? 'border-indigo-500/50 bg-indigo-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-zinc-400'
                      }`}
                      onClick={() => setMetodoPagamento('BOLETO')}
                    >
                      Boleto
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            {metodoPagamento === 'BOLETO' && !isGratuito ? (
              <div className="space-y-2">
                <Label htmlFor="compradorCpf">Seu CPF (titular do boleto)</Label>
                <Input
                  id="compradorCpf"
                  value={compradorCpf}
                  onChange={(e) => setCompradorCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  required
                />
                {total < 2.5 ? (
                  <p className="text-xs text-amber-300">
                    Boleto exige valor mínimo de R$ 2,50 (total atual: {formatCurrency(total)}).
                  </p>
                ) : null}
              </div>
            ) : null}

            <p className="text-sm text-zinc-300">
              Total:{' '}
              {isGratuito ? (
                <span className="font-semibold text-emerald-300">Grátis</span>
              ) : precoOriginal && precoOriginal > preco ? (
                <>
                  <span className="text-zinc-500 line-through">
                    {formatCurrency(precoOriginal * quantidade)}
                  </span>{' '}
                  <span className="font-medium text-emerald-300">
                    {formatCurrency(total)}
                  </span>
                  {descontoPercentual && descontoPercentual > 0 ? (
                    <span className="text-indigo-300">
                      {' '}
                      ({descontoPercentual}% off)
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="font-medium text-white">
                  {formatCurrency(total)}
                </span>
              )}
            </p>

            <Button
              variant="primary"
              className="w-full"
              isDisabled={isLoading}
              onPress={() => void handleCheckout()}
            >
              {isLoading
                ? 'Processando...'
                : isGratuito
                  ? 'Confirmar ingresso grátis'
                  : usaCheckoutOnline
                    ? 'Ir para pagamento'
                    : metodoPagamento === 'BOLETO'
                      ? 'Continuar para boleto'
                      : 'Continuar para PIX'}
            </Button>
          </div>
        ) : null}

        {step === 'pagamento' && checkout ? (
          <div className="space-y-4">
            {isCheckoutOnline ? (
              <>
                <p className="text-sm text-zinc-400">
                  {checkout.gateway === 'infinitypay'
                    ? 'Você será redirecionado ao checkout InfinitePay. Após pagar, volte para ver seus ingressos.'
                    : 'Simulação InfinitePay: confirme o pagamento para gerar seus ingressos.'}
                </p>
                {checkout.checkoutUrl ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onPress={() => window.location.assign(checkout.checkoutUrl!)}
                  >
                    Abrir checkout InfinitePay
                  </Button>
                ) : null}
                {isPagamentoReal ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2.5 text-sm text-indigo-200">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    {isAguardandoPagamento ? 'Aguardando pagamento...' : 'Processando...'}
                  </div>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    isDisabled={isLoading}
                    onPress={() => void handleConfirmarPix()}
                  >
                    {isLoading ? 'Confirmando...' : 'Confirmar pagamento'}
                  </Button>
                )}
              </>
            ) : isBoleto ? (
              <>
                <p className="text-sm text-zinc-400">
                  {isPagamentoReal
                    ? 'Seu boleto foi emitido. Abra o PDF, pague até o vencimento e aguarde a compensação para liberar os ingressos.'
                    : 'Simulação de boleto: confirme o pagamento para gerar seus ingressos.'}
                </p>
                {checkout.dataVencimento ? (
                  <p className="text-xs text-zinc-500">
                    Vencimento:{' '}
                    {new Intl.DateTimeFormat('pt-BR').format(
                      new Date(`${checkout.dataVencimento}T12:00:00`),
                    )}
                  </p>
                ) : null}
                {checkout.boletoPdfUrl ? (
                  <Button
                    variant="primary"
                    className="w-full"
                    onPress={() => void handleBaixarBoletoPdf()}
                  >
                    <FileText className="size-4" aria-hidden />
                    Abrir boleto (PDF)
                  </Button>
                ) : null}
                {checkout.linhaDigitavel ? (
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="mb-1 text-xs text-zinc-500">Linha digitável</p>
                    <p className="break-all font-mono text-xs text-zinc-300">
                      {checkout.linhaDigitavel}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    Linha digitável em processamento. Abra o PDF do boleto ou aguarde alguns segundos.
                  </p>
                )}
                {checkout.linhaDigitavel ? (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onPress={() => void handleCopyLinhaDigitavel()}
                  >
                    <Copy className="size-4" aria-hidden />
                    Copiar linha digitável
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400">
                  {checkout.gateway === 'inter-pix'
                    ? 'Pague com Pix no app do seu banco. Seus ingressos serão liberados automaticamente após a confirmação.'
                    : 'Simulação PIX: copie o código ou confirme o pagamento para gerar seus ingressos.'}
                </p>
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <p className="break-all font-mono text-xs text-zinc-300">
                    {checkout.pixCopiaCola}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="w-full"
                  onPress={() => void handleCopyLinhaDigitavel()}
                >
                  <Copy className="size-4" aria-hidden />
                  Copiar PIX
                </Button>
              </>
            )}
            {!isCheckoutOnline ? (
              isPagamentoReal ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2.5 text-sm text-indigo-200">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  {isAguardandoPagamento ? 'Aguardando pagamento...' : 'Processando...'}
                </div>
              ) : (
                <Button
                  variant="primary"
                  className="w-full"
                  isDisabled={isLoading}
                  onPress={() => void handleConfirmarPix()}
                >
                  {isLoading ? 'Confirmando...' : 'Confirmar pagamento'}
                </Button>
              )
            ) : null}
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
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-300/80">
                    {ingressos.length > 1
                      ? `Ingresso ${index + 1} de ${ingressos.length}`
                      : 'Seu ingresso'}
                  </p>
                  <p className="mb-3 text-sm font-medium text-white">
                    {ingresso.participanteNome}
                  </p>
                  <IngressoQrCodeResponsive codigo={ingresso.codigo} />
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
