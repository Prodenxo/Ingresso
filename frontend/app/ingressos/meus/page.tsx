'use client'

import { Card, Chip } from '@heroui/react'
import { CalendarDays, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { apiFetch } from '@/lib/api-client'
import { formatEventDate, statusLabel } from '@/lib/ingressos-utils'
import { formatCurrency } from '@/lib/utils'
import type { MeuIngresso } from '@/types/ingressos'

export default function MeusIngressosPage() {
  const { isReady } = useRequireParticipant()
  const [ingressos, setIngressos] = useState<MeuIngresso[]>([])
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    let active = true

    async function loadIngressos() {
      try {
        const data = await apiFetch<MeuIngresso[]>('/ingressos/me')
        if (active) {
          setIngressos(data)
        }
      } catch {
        if (active) {
          setIngressos([])
        }
      } finally {
        if (active) {
          setIsFetching(false)
        }
      }
    }

    if (isReady) {
      void loadIngressos()
    }

    return () => {
      active = false
    }
  }, [isReady])

  if (!isReady) {
    return null
  }

  return (
    <ParticipantShell
      title="Meus ingressos"
      subtitle="Ingressos vinculados ao seu e-mail"
    >
      {isFetching ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando ingressos...</p>
        </Card>
      ) : ingressos.length === 0 ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
            <Ticket className="size-5" aria-hidden />
          </div>
          <h3 className="text-lg font-medium text-white">Nenhum ingresso ainda</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Quando você comprar ingressos, eles aparecerão aqui.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ingressos.map((ingresso) => (
            <Card
              key={ingresso.id}
              className="glass-panel rounded-2xl border-white/10 p-0"
            >
              <Card.Header className="flex flex-row items-start justify-between gap-4 px-5 pt-5">
                <div>
                  <Card.Title className="text-white">
                    {ingresso.evento.nome}
                  </Card.Title>
                  <Card.Description className="mt-1 flex items-center gap-2 text-zinc-400">
                    <CalendarDays className="size-4" aria-hidden />
                    {formatEventDate(ingresso.evento.dataInicio)}
                  </Card.Description>
                </div>
                <Chip size="sm" variant="soft" color="accent">
                  {statusLabel(ingresso.status)}
                </Chip>
              </Card.Header>
              <Card.Content className="space-y-2 px-5 pb-5 text-sm text-zinc-300">
                <p>
                  <span className="text-zinc-500">Lote:</span> {ingresso.lote.nome}
                </p>
                <p>
                  <span className="text-zinc-500">Valor:</span>{' '}
                  {formatCurrency(Number(ingresso.lote.preco))}
                </p>
                <p>
                  <span className="text-zinc-500">Participante:</span>{' '}
                  {ingresso.participanteNome}
                </p>
              </Card.Content>
            </Card>
          ))}
        </div>
      )}
    </ParticipantShell>
  )
}
