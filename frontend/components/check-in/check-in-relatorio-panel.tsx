'use client'

import { Card, Chip } from '@heroui/react'
import { useEffect, useState } from 'react'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { CheckInRelatorio } from '@/types/check-in'

interface CheckInRelatorioPanelProps {
  eventoId: string
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function CheckInRelatorioPanel({ eventoId }: CheckInRelatorioPanelProps) {
  const [relatorio, setRelatorio] = useState<CheckInRelatorio | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'inconsistentes'>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    void apiFetch<CheckInRelatorio>(`/check-in/relatorio/${eventoId}`)
      .then(setRelatorio)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar relatório'),
      )
      .finally(() => setIsLoading(false))
  }, [eventoId])

  if (isLoading) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-zinc-400">Carregando relatório...</p>
      </Card>
    )
  }

  if (error || !relatorio) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-red-300">{error ?? 'Relatório indisponível'}</p>
      </Card>
    )
  }

  const participantes = relatorio.participantes.filter((p) =>
    filtro === 'inconsistentes' ? Boolean(p.inconsistencia) : true,
  )

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-white">Relatório bate-ponto</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {relatorio.resumo.completos} completos · {relatorio.resumo.comInconsistencia}{' '}
            inconsistências
          </p>
        </div>
        <select
          value={filtro}
          onChange={(event) =>
            setFiltro(event.target.value as 'todos' | 'inconsistentes')
          }
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <option value="todos" className="bg-zinc-900">
            Todos
          </option>
          <option value="inconsistentes" className="bg-zinc-900">
            Só inconsistências
          </option>
        </select>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-white">
            {relatorio.resumo.soDia1}
          </p>
          <p className="text-xs text-zinc-500">Só dia 1</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-white">
            {relatorio.resumo.soDia2}
          </p>
          <p className="text-xs text-zinc-500">Só dia 2 / sem dia 1</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-white">
            {relatorio.resumo.totalParticipantes}
          </p>
          <p className="text-xs text-zinc-500">Participantes</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs text-zinc-500">
              <th className="px-2 py-2">Participante</th>
              {Array.from({ length: relatorio.evento.checkinDias }, (_, diaIndex) =>
                relatorio.evento.pontosCheckin.map((ponto) => (
                  <th key={`${diaIndex}-${ponto.id}`} className="px-2 py-2">
                    D{diaIndex + 1} · {ponto.nome}
                  </th>
                )),
              )}
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {participantes.map((participante) => {
              const celula = (dia: number, pontoId: string) => {
                const registro = participante.registros.find(
                  (r) => r.diaEvento === dia && r.pontoId === pontoId,
                )
                return registro ? formatDateTime(registro.realizadoEm) : '—'
              }

              return (
                <tr key={participante.ingressoId} className="border-b border-white/5">
                  <td className="px-2 py-2 text-zinc-200">
                    <p className="font-medium">{participante.participanteNome}</p>
                    <p className="text-xs text-zinc-500">{participante.codigo}</p>
                  </td>
                  {Array.from({ length: relatorio.evento.checkinDias }, (_, diaIndex) =>
                    relatorio.evento.pontosCheckin.map((ponto) => (
                      <td
                        key={`${participante.ingressoId}-${diaIndex}-${ponto.id}`}
                        className="px-2 py-2 text-xs text-zinc-400"
                      >
                        {celula(diaIndex + 1, ponto.id)}
                      </td>
                    )),
                  )}
                  <td className="px-2 py-2">
                    {participante.inconsistencia ? (
                      <Chip size="sm" color="warning">
                        {participante.inconsistencia}
                      </Chip>
                    ) : (
                      <Chip size="sm" color="success">
                        OK
                      </Chip>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
