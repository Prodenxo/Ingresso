'use client'

import { Button, Card, Chip } from '@heroui/react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckoutPixModal } from '@/components/ingressos/checkout-pix-modal'
import { EventoVitrineCard } from '@/components/ingressos/evento-vitrine-card'
import { VincularCodigoCard } from '@/components/membros/vincular-codigo-card'
import { EmpresasVinculadasCard } from '@/components/membros/empresas-vinculadas-card'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { apiFetch } from '@/lib/api-client'
import {
  calcPrecoComDescontoIndicacao,
  getLinkIndicacao,
  saveLinkIndicacao,
} from '@/lib/link-indicacao-storage'
import { getEmpresasMembro, temVinculoEmpresa } from '@/lib/auth-roles'
import { buildCheckoutLoteLabel } from '@/lib/ingressos-utils'
import type { LinkIndicacaoPublico } from '@/types/links-indicacao'
import type { EventoDisponivel, FormaPagamentoDisponivel, LoteDisponivel } from '@/types/ingressos'

interface CheckoutTarget {
  lote: LoteDisponivel
  eventoNome: string
  loteIndex: number
  totalLotes: number
  formasPagamento: FormaPagamentoDisponivel[]
  precoCheckout: number
  precoOriginal?: number
  descontoPercentual?: number | null
}

function abrirCheckoutDoLink(
  eventos: EventoDisponivel[],
  link: LinkIndicacaoPublico,
): CheckoutTarget | null {
  if (!link.loteId) return null

  for (const evento of eventos) {
    if (evento.id !== link.eventoId) continue

    const loteIndex = evento.lotes.findIndex((item) => item.id === link.loteId)
    if (loteIndex < 0) continue

    const lote = evento.lotes[loteIndex]
    const precoCheckout =
      link.precoComDesconto ??
      calcPrecoComDescontoIndicacao(lote.preco, link.descontoPercentual)

    return {
      lote,
      eventoNome: evento.nome,
      loteIndex,
      totalLotes: evento.lotes.length,
      formasPagamento: evento.formasPagamento ?? ['PIX', 'BOLETO'],
      precoCheckout,
      precoOriginal: lote.preco,
      descontoPercentual: link.descontoPercentual,
    }
  }

  return null
}

export default function IngressosDisponiveisPage() {
  const { isReady, user, refreshUser } = useRequireParticipant()
  const searchParams = useSearchParams()
  const [disponiveis, setDisponiveis] = useState<EventoDisponivel[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [linkIndicacao, setLinkIndicacao] = useState<LinkIndicacaoPublico | null>(
    null,
  )
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(
    null,
  )
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const autoCheckoutDoneRef = useRef(false)

  const loadDisponiveis = useCallback(async () => {
    setIsFetching(true)

    try {
      const data = await apiFetch<EventoDisponivel[]>('/eventos/disponiveis')
      setDisponiveis(data)
    } catch {
      setDisponiveis([])
    } finally {
      setIsFetching(false)
    }
  }, [])

  useEffect(() => {
    async function resolverRefParam() {
      const ref = searchParams.get('ref')?.trim()
      if (!ref) {
        setLinkIndicacao(getLinkIndicacao())
        return
      }

      try {
        const data = await apiFetch<LinkIndicacaoPublico>(
          `/links-indicacao/publico/${ref}`,
        )
        saveLinkIndicacao(data)
        setLinkIndicacao(data)
      } catch {
        setLinkIndicacao(getLinkIndicacao())
      }
    }

    void resolverRefParam()
  }, [searchParams])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (searchParams.get('ref')?.trim()) return

    setLinkIndicacao(getLinkIndicacao())
  }, [searchParams])

  useEffect(() => {
    if (!isReady) return

    async function bootstrap() {
      setIsBootstrapping(true)

      try {
        const link = getLinkIndicacao()
        if (link?.slug) {
          try {
            await apiFetch('/links-indicacao/vincular', {
              method: 'POST',
              body: JSON.stringify({ slug: link.slug }),
            })
            await refreshUser()
          } catch {
            // link inválido ou vínculo já existente
          }
        }
      } finally {
        await loadDisponiveis()
        setIsBootstrapping(false)
      }
    }

    void bootstrap()
  }, [isReady, loadDisponiveis, refreshUser])

  useEffect(() => {
    if (
      autoCheckoutDoneRef.current ||
      !linkIndicacao?.loteId ||
      disponiveis.length === 0 ||
      checkoutTarget
    ) {
      return
    }

    const target = abrirCheckoutDoLink(disponiveis, linkIndicacao)
    if (target) {
      autoCheckoutDoneRef.current = true
      setCheckoutTarget(target)
    }
  }, [checkoutTarget, disponiveis, linkIndicacao])

  if (!isReady) {
    return null
  }

  const vinculado = temVinculoEmpresa(user)

  return (
    <ParticipantShell
      title="Ingressos"
      subtitle={
        vinculado
          ? 'Eventos disponíveis nas empresas vinculadas à sua conta'
          : 'Vincule-se a uma empresa para ver eventos exclusivos'
      }
    >
      {linkIndicacao?.loteNome && linkIndicacao.descontoPercentual ? (
        <Card className="glass-panel mb-4 rounded-2xl border-indigo-500/20 bg-indigo-500/5 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm" variant="soft" color="accent">
              Link de indicação
            </Chip>
            <p className="text-sm text-zinc-300">
              Desconto de {linkIndicacao.descontoPercentual}% no ingresso{' '}
              <span className="font-medium text-white">
                {linkIndicacao.loteNome}
              </span>
            </p>
          </div>
        </Card>
      ) : null}

      {!vinculado && isBootstrapping ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Preparando seu acesso aos ingressos...</p>
        </Card>
      ) : !vinculado ? (
        <div className="mx-auto max-w-lg space-y-4">
          <Card className="glass-panel rounded-2xl border-white/10 p-6 text-center">
            <h3 className="text-lg font-medium text-white">
              Você ainda não está vinculado
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Peça o link ou código de convite à organização do evento.
            </p>
            <Link
              href="/ingressos/vincular"
              className="mt-4 inline-block text-sm text-indigo-300 hover:underline"
            >
              Inserir código de convite
            </Link>
          </Card>
          <VincularCodigoCard
            onSuccess={() => {
              void refreshUser()
              void loadDisponiveis()
            }}
          />
        </div>
      ) : isFetching || isBootstrapping ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando eventos...</p>
        </Card>
      ) : disponiveis.length === 0 ? (
        <div className="mx-auto max-w-lg space-y-4">
          <EmpresasVinculadasCard
            empresas={getEmpresasMembro(user)}
            showLinkIngressos={false}
          />
          <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <ShoppingCart className="size-5" aria-hidden />
          </div>
          <h3 className="text-lg font-medium text-white">
            Nenhum ingresso à venda no momento
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Quando a empresa publicar eventos, eles aparecerão aqui.
          </p>
          </Card>
        </div>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {disponiveis.map((evento) => (
            <EventoVitrineCard
              key={evento.id}
              evento={evento}
              linkIndicacao={
                linkIndicacao?.eventoId === evento.id ? linkIndicacao : null
              }
              onComprar={(lote) => {
                const loteIndex = evento.lotes.findIndex((item) => item.id === lote.id)
                const aplicaDesconto =
                  linkIndicacao?.eventoId === evento.id &&
                  linkIndicacao.loteId === lote.id

                const precoCheckout = aplicaDesconto
                  ? linkIndicacao.precoComDesconto ??
                    calcPrecoComDescontoIndicacao(
                      lote.preco,
                      linkIndicacao.descontoPercentual,
                    )
                  : lote.preco

                setCheckoutTarget({
                  lote,
                  eventoNome: evento.nome,
                  loteIndex: loteIndex >= 0 ? loteIndex : 0,
                  totalLotes: evento.lotes.length,
                  formasPagamento: evento.formasPagamento ?? ['PIX', 'BOLETO'],
                  precoCheckout,
                  precoOriginal: aplicaDesconto ? lote.preco : undefined,
                  descontoPercentual: aplicaDesconto
                    ? linkIndicacao.descontoPercentual
                    : undefined,
                })
              }}
            />
          ))}
        </div>
      )}

      {checkoutTarget ? (
        <CheckoutPixModal
          loteId={checkoutTarget.lote.id}
          loteNome={buildCheckoutLoteLabel(
            checkoutTarget.eventoNome,
            checkoutTarget.lote.nome,
            checkoutTarget.loteIndex,
            checkoutTarget.totalLotes,
          )}
          preco={checkoutTarget.precoCheckout}
          precoOriginal={checkoutTarget.precoOriginal}
          descontoPercentual={checkoutTarget.descontoPercentual}
          limitePorCompra={checkoutTarget.lote.limitePorCompra}
          disponiveis={checkoutTarget.lote.disponiveis}
          formasPagamento={checkoutTarget.formasPagamento}
          onClose={() => setCheckoutTarget(null)}
          onSuccess={() => void loadDisponiveis()}
        />
      ) : null}
    </ParticipantShell>
  )
}
