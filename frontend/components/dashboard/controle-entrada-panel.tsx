'use client'

import { Card, Chip } from '@heroui/react'
import { DoorOpen, Ticket, UserCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api-client'
import type { ControleEntradaResumo } from '@/types/dashboard'

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

interface ControleEntradaPanelProps {
  refreshKey?: number
}

export function ControleEntradaPanel({ refreshKey = 0 }: ControleEntradaPanelProps) {
  const [data, setData] = useState<ControleEntradaResumo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadData = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await apiFetch<ControleEntradaResumo>('/dashboard/controle-entrada')
      setData(result)
    } catch {
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData, refreshKey])

  if (isLoading) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-zinc-400">Carregando controle de entrada...</p>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-red-300">
          Não foi possível carregar o controle de entrada.
        </p>
      </Card>
    )
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-0">
      <Card.Header className="px-5 pt-5">
        <Card.Title className="text-white">Controle de entrada</Card.Title>
        <Card.Description>
          Ingressos vendidos vs. validados na porta do evento
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-5 px-5 pb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-zinc-400">
              <Ticket className="size-4" aria-hidden />
              <span className="text-xs uppercase tracking-wide">Vendidos</span>
            </div>
            <p className="text-2xl font-semibold text-white">{data.totais.vendidos}</p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-300/80">
              <UserCheck className="size-4" aria-hidden />
              <span className="text-xs uppercase tracking-wide">Validados</span>
            </div>
            <p className="text-2xl font-semibold text-emerald-100">
              {data.totais.validados}
            </p>
            <p className="mt-1 text-xs text-emerald-200/70">
              {data.totais.taxaEntrada}% entraram
            </p>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-indigo-300/80">
              <DoorOpen className="size-4" aria-hidden />
              <span className="text-xs uppercase tracking-wide">Aguardando</span>
            </div>
            <p className="text-2xl font-semibold text-indigo-100">
              {data.totais.aguardandoEntrada}
            </p>
            <p className="mt-1 text-xs text-indigo-200/70">Ainda não entraram</p>
          </div>
        </div>

        {data.eventos.length === 0 ? (
          <p className="rounded-xl border border-white/8 bg-white/3 px-4 py-6 text-center text-sm text-zinc-400">
            Nenhum ingresso vendido ainda.
          </p>
        ) : (
          <ul className="space-y-3" aria-label="Entrada por evento">
            {data.eventos.map((evento) => (
              <li
                key={evento.id}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{evento.nome}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {formatEventDate(evento.dataInicio)}
                    </p>
                  </div>
                  <Chip size="sm" variant="soft" color="accent">
                    {evento.taxaEntrada}% entraram
                  </Chip>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-zinc-500">Vendidos</p>
                    <p className="mt-1 text-base font-medium text-white">
                      {evento.vendidos}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Validados</p>
                    <p className="mt-1 text-base font-medium text-emerald-300">
                      {evento.validados}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Aguardando</p>
                    <p className="mt-1 text-base font-medium text-indigo-300">
                      {evento.aguardandoEntrada}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{ width: `${evento.taxaEntrada}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  )
}
