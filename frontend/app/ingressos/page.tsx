'use client'

import { Button, Card, Chip } from '@heroui/react'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CheckoutPixModal } from '@/components/ingressos/checkout-pix-modal'
import { EventoVitrineCard } from '@/components/ingressos/evento-vitrine-card'
import { VincularCodigoCard } from '@/components/membros/vincular-codigo-card'
import { EmpresasVinculadasCard } from '@/components/membros/empresas-vinculadas-card'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { apiFetch } from '@/lib/api-client'
import { getEmpresasMembro, temVinculoEmpresa } from '@/lib/auth-roles'
import { buildCheckoutLoteLabel } from '@/lib/ingressos-utils'
import type { EventoDisponivel, LoteDisponivel } from '@/types/ingressos'

interface CheckoutTarget {
  lote: LoteDisponivel
  eventoNome: string
  loteIndex: number
  totalLotes: number
}

export default function IngressosDisponiveisPage() {
  const { isReady, user, refreshUser } = useRequireParticipant()
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
      {!vinculado ? (
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
      ) : isFetching ? (
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
