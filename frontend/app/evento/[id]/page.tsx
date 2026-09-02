'use client'

import { Card, Chip } from '@heroui/react'
import Link from 'next/link'
import { Loader2, Ticket } from 'lucide-react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { CheckoutPixModal } from '@/components/ingressos/checkout-pix-modal'
import { EventoVitrineCard } from '@/components/ingressos/evento-vitrine-card'
import { apiFetch } from '@/lib/api-client'
import {
  buildEventoPublicoLoginUrl,
  buildEventoPublicoRegisterUrl,
  consumePendingEventoCheckout,
  savePendingEventoCheckout,
} from '@/lib/evento-publico'
import {
  calcPrecoComDescontoIndicacao,
  getLinkIndicacao,
  saveLinkIndicacao,
} from '@/lib/link-indicacao-storage'
import { buildCheckoutLoteLabel } from '@/lib/ingressos-utils'
import type { LinkIndicacaoPublico } from '@/types/links-indicacao'
import type { EventoDisponivel, FormaPagamentoDisponivel, LoteDisponivel } from '@/types/ingressos'

interface CheckoutTarget {
  lote: LoteDisponivel
  loteIndex: number
  precoCheckout: number
  precoOriginal?: number
  descontoPercentual?: number | null
  formasPagamento: FormaPagamentoDisponivel[]
}

function EventoPublicoContent() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { isLoading: authLoading, isAuthenticated, refreshUser } = useAuth()

  const eventoId = params.id
  const [evento, setEvento] = useState<EventoDisponivel | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [linkIndicacao, setLinkIndicacao] = useState<LinkIndicacaoPublico | null>(null)
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(null)
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false)
  const pendingCheckoutHandledRef = useRef(false)

  const loadEvento = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<EventoDisponivel>(`/eventos/publico/${eventoId}`)
      setEvento(data)
    } catch {
      setEvento(null)
      setError('Este evento não está disponível no momento.')
    } finally {
      setIsLoading(false)
    }
  }, [eventoId])

  useEffect(() => {
    void loadEvento()
  }, [loadEvento])

  useEffect(() => {
    async function resolverRef() {
      const ref = searchParams.get('ref')?.trim()
      if (!ref) {
        const stored = getLinkIndicacao()
        if (stored?.eventoId === eventoId) {
          setLinkIndicacao(stored)
        }
        return
      }

      try {
        const data = await apiFetch<LinkIndicacaoPublico>(
          `/links-indicacao/publico/${ref}`,
        )
        saveLinkIndicacao(data)
        setLinkIndicacao(data.eventoId === eventoId ? data : null)
      } catch {
        const stored = getLinkIndicacao()
        setLinkIndicacao(stored?.eventoId === eventoId ? stored : null)
      }
    }

    void resolverRef()
  }, [eventoId, searchParams])

  const abrirCheckout = useCallback(
    async (lote: LoteDisponivel) => {
      if (!evento) return

      const loteIndex = evento.lotes.findIndex((item) => item.id === lote.id)
      const aplicaDesconto =
        linkIndicacao?.eventoId === evento.id && linkIndicacao.loteId === lote.id

      const precoCheckout = aplicaDesconto
        ? linkIndicacao.precoComDesconto ??
          calcPrecoComDescontoIndicacao(lote.preco, linkIndicacao.descontoPercentual)
        : lote.preco

      if (!isAuthenticated) {
        savePendingEventoCheckout(evento.id, lote.id)
        router.push(buildEventoPublicoRegisterUrl(evento.id))
        return
      }

      setIsPreparingCheckout(true)

      try {
        await apiFetch(`/eventos/publico/${evento.id}/vincular`, { method: 'POST' })

        if (linkIndicacao?.slug) {
          try {
            await apiFetch('/links-indicacao/vincular', {
              method: 'POST',
              body: JSON.stringify({ slug: linkIndicacao.slug }),
            })
          } catch {
            // vínculo já existente ou link inválido
          }
        }

        await refreshUser()

        setCheckoutTarget({
          lote,
          loteIndex: loteIndex >= 0 ? loteIndex : 0,
          precoCheckout,
          precoOriginal: aplicaDesconto ? lote.preco : undefined,
          descontoPercentual: aplicaDesconto ? linkIndicacao.descontoPercentual : undefined,
          formasPagamento: evento.formasPagamento ?? ['PIX', 'BOLETO'],
        })
      } finally {
        setIsPreparingCheckout(false)
      }
    },
    [evento, isAuthenticated, linkIndicacao, refreshUser, router],
  )

  useEffect(() => {
    if (
      pendingCheckoutHandledRef.current ||
      authLoading ||
      !isAuthenticated ||
      !evento ||
      isPreparingCheckout ||
      checkoutTarget
    ) {
      return
    }

    const pendingLoteId = consumePendingEventoCheckout(evento.id)
    if (!pendingLoteId) return

    const lote = evento.lotes.find((item) => item.id === pendingLoteId)
    if (!lote) return

    pendingCheckoutHandledRef.current = true
    void abrirCheckout(lote)
  }, [
    abrirCheckout,
    authLoading,
    checkoutTarget,
    evento,
    isAuthenticated,
    isPreparingCheckout,
  ])

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070d]">
        <div className="flex items-center gap-3 text-zinc-400">
          <Loader2 className="size-5 animate-spin" aria-hidden />
          <p className="text-sm">Carregando evento...</p>
        </div>
      </div>
    )
  }

  if (error || !evento) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07070d] p-6">
        <Card className="glass-panel max-w-md rounded-2xl border-white/10 p-6 text-center">
          <p className="text-sm text-red-300">{error ?? 'Evento indisponível.'}</p>
          <Link href="/login" className="mt-4 inline-block text-sm text-indigo-300 hover:underline">
            Entrar na plataforma
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#07070d]">
      <header className="border-b border-white/8 bg-black/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <p className="text-sm font-medium text-white">Onith Eventos</p>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link
                href="/ingressos/meus"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
              >
                <Ticket className="size-3.5" aria-hidden />
                Meus ingressos
              </Link>
            ) : (
              <>
                <Link
                  href={buildEventoPublicoLoginUrl(eventoId)}
                  className="inline-flex rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-white"
                >
                  Entrar
                </Link>
                <Link
                  href={buildEventoPublicoRegisterUrl(eventoId)}
                  className="inline-flex rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-500"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {linkIndicacao?.loteNome && linkIndicacao.descontoPercentual ? (
          <Card className="glass-panel mb-4 rounded-2xl border-indigo-500/20 bg-indigo-500/5 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm" variant="soft" color="accent">
                Link de indicação
              </Chip>
              <p className="text-sm text-zinc-300">
                Desconto de {linkIndicacao.descontoPercentual}% no ingresso{' '}
                <span className="font-medium text-white">{linkIndicacao.loteNome}</span>
              </p>
            </div>
          </Card>
        ) : null}

        <EventoVitrineCard
          evento={evento}
          linkIndicacao={linkIndicacao}
          showBannerHero
          onComprar={(lote) => void abrirCheckout(lote)}
        />

        {!isAuthenticated ? (
          <p className="mt-4 text-center text-xs text-zinc-500">
            Ao comprar, você cria uma conta e acessa seus ingressos em{' '}
            <span className="text-zinc-400">Meus ingressos</span>.
          </p>
        ) : null}
      </main>

      {checkoutTarget ? (
        <CheckoutPixModal
          loteId={checkoutTarget.lote.id}
          loteNome={buildCheckoutLoteLabel(
            evento.nome,
            checkoutTarget.lote.nome,
            checkoutTarget.loteIndex,
            evento.lotes.length,
          )}
          preco={checkoutTarget.precoCheckout}
          precoOriginal={checkoutTarget.precoOriginal}
          descontoPercentual={checkoutTarget.descontoPercentual}
          limitePorCompra={checkoutTarget.lote.limitePorCompra}
          disponiveis={checkoutTarget.lote.disponiveis}
          formasPagamento={checkoutTarget.formasPagamento}
          onClose={() => setCheckoutTarget(null)}
          onSuccess={() => void loadEvento()}
        />
      ) : null}
    </div>
  )
}

export default function EventoPublicoRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07070d]">
          <p className="text-sm text-zinc-400">Carregando evento...</p>
        </div>
      }
    >
      <EventoPublicoContent />
    </Suspense>
  )
}
