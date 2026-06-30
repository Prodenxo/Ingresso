'use client'

import { Button, Card, Chip } from '@heroui/react'
import { CalendarDays, MapPin, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ParticipantShell } from '@/components/layout/participant-shell'
import { useRequireParticipant } from '@/hooks/use-require-participant'
import { apiFetch } from '@/lib/api-client'
import { formatEventDate, formatLocation } from '@/lib/ingressos-utils'
import { formatCurrency } from '@/lib/utils'
import type { EventoDisponivel } from '@/types/ingressos'

export default function IngressosDisponiveisPage() {
  const { isReady } = useRequireParticipant()
  const [disponiveis, setDisponiveis] = useState<EventoDisponivel[]>([])
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDisponiveis() {
      try {
        const data = await apiFetch<EventoDisponivel[]>('/eventos/disponiveis')
        if (active) {
          setDisponiveis(data)
        }
      } catch {
        if (active) {
          setDisponiveis([])
        }
      } finally {
        if (active) {
          setIsFetching(false)
        }
      }
    }

    if (isReady) {
      void loadDisponiveis()
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
        <div className="grid gap-4">
          {disponiveis.map((evento) => {
            const location = formatLocation(evento)

            return (
              <Card
                key={evento.id}
                className="glass-panel rounded-2xl border-white/10 p-0"
              >
                <Card.Header className="px-5 pt-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Card.Description className="text-zinc-500">
                        {evento.empresa.nome}
                      </Card.Description>
                      <Card.Title className="mt-1 text-white">
                        {evento.nome}
                      </Card.Title>
                      <Card.Description className="mt-2 flex flex-wrap items-center gap-3 text-zinc-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4" aria-hidden />
                          {formatEventDate(evento.dataInicio)}
                        </span>
                        {location ? (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="size-4" aria-hidden />
                            {location}
                          </span>
                        ) : null}
                      </Card.Description>
                    </div>
                    <Chip size="sm" variant="soft" color="success">
                      {evento.lotes.length}{' '}
                      {evento.lotes.length === 1 ? 'lote' : 'lotes'}
                    </Chip>
                  </div>
                </Card.Header>

                <Card.Content className="space-y-3 px-5 pb-5">
                  {evento.descricao ? (
                    <p className="text-sm text-zinc-400">{evento.descricao}</p>
                  ) : null}

                  <div className="space-y-2">
                    {evento.lotes.map((lote) => (
                      <div
                        key={lote.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-white">{lote.nome}</p>
                          <p className="text-sm text-zinc-400">
                            {formatCurrency(lote.preco)} · {lote.disponiveis}{' '}
                            disponíveis
                          </p>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          isDisabled
                          aria-label="Comprar ingresso — checkout em breve"
                        >
                          Comprar
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card.Content>
              </Card>
            )
          })}
        </div>
      )}
    </ParticipantShell>
  )
}
