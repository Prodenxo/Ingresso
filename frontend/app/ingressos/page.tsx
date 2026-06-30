'use client'

import { Button, Card, Chip } from '@heroui/react'
import { ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CheckoutPixModal } from '@/components/ingressos/checkout-pix-modal'
import { EventoVitrineCard } from '@/components/ingressos/evento-vitrine-card'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { apiFetch } from '@/lib/api-client'
import { buildCheckoutLoteLabel } from '@/lib/ingressos-utils'
import type { EventoDisponivel, LoteDisponivel } from '@/types/ingressos'

interface CheckoutTarget {
  lote: LoteDisponivel
  eventoNome: string
  loteIndex: number
  totalLotes: number
}

export default function IngressosDisponiveisPage() {
  const { isReady } = useRequireParticipant()
  const [disponiveis, setDisponiveis] = useState<EventoDisponivel[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const [checkoutTarget, setCheckoutTarget] = useState<CheckoutTarget | null>(
    null,
  )

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
    if (isReady) {
      void loadDisponiveis()
    }
  }, [isReady, loadDisponiveis])

  if (!isReady) {
    return null
  }

  return (
    <ParticipantShell
      title="Ingressos"
      subtitle="Eventos com ingressos disponíveis para compra"
    >
      {isFetching ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando eventos...</p>
        </Card>
      ) : disponiveis.length === 0 ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <ShoppingCart className="size-5" aria-hidden />
          </div>
          <h3 className="text-lg font-medium text-white">
            Nenhum ingresso à venda no momento
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Quando organizadores publicarem eventos, eles aparecerão aqui.
          </p>
        </Card>
      ) : (
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {disponiveis.map((evento) => (
            <EventoVitrineCard
              key={evento.id}
              evento={evento}
              onComprar={(lote) => {
                const loteIndex = evento.lotes.findIndex((item) => item.id === lote.id)

                setCheckoutTarget({
                  lote,
                  eventoNome: evento.nome,
                  loteIndex: loteIndex >= 0 ? loteIndex : 0,
                  totalLotes: evento.lotes.length,
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
          preco={checkoutTarget.lote.preco}
          limitePorCompra={checkoutTarget.lote.limitePorCompra}
          disponiveis={checkoutTarget.lote.disponiveis}
          onClose={() => setCheckoutTarget(null)}
          onSuccess={() => void loadDisponiveis()}
        />
      ) : null}
    </ParticipantShell>
  )
}
