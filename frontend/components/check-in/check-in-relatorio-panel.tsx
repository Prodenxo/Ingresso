'use client'

import { Button, Card, Chip } from '@heroui/react'
import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
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

function statusIngressoLabel(status: string): string {
  if (status === 'UTILIZADO') return 'Concluído'
  if (status === 'VALIDO') return 'Em andamento'
  return status
}

export function CheckInRelatorioPanel({ eventoId }: CheckInRelatorioPanelProps) {
  const [relatorio, setRelatorio] = useState<CheckInRelatorio | null>(null)
  const [filtro, setFiltro] = useState<'todos' | 'inconsistentes'>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarRelatorio = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<CheckInRelatorio>(
        `/check-in/relatorio/${eventoId}`,
      )
      setRelatorio(data)
    } catch (err) {
      setRelatorio(null)
      setError(
        err instanceof ApiError ? err.message : 'Erro ao carregar relatório',
      )
    } finally {
      setIsLoading(false)
    }
  }, [eventoId])

  useEffect(() => {
    void carregarRelatorio()
  }, [carregarRelatorio])

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
        {error?.includes('bate-ponto') ? (
          <Link
            href={`/eventos/${eventoId}`}
            className="mt-3 inline-block text-sm text-indigo-300 hover:underline"
          >
            Configurar check-in bate-ponto
          </Link>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onPress={() => void carregarRelatorio()}
          >
            Tentar novamente
          </Button>
        )}
      </Card>
    )
  }

  const participantes = relatorio.participantes.filter((p) =>
    filtro === 'inconsistentes' ? Boolean(p.inconsistencia) : true,
  )

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium text-white">
            {relatorio.evento.nome}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            {relatorio.resumo.completos} completos ·{' '}
            {relatorio.resumo.comInconsistencia} inconsistências ·{' '}
            {relatorio.resumo.totalParticipantes} participantes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filtro}
            onChange={(event) =>
              setFiltro(event.target.value as 'todos' | 'inconsistentes')
            }
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            aria-label="Filtrar participantes"
          >
            <option value="todos" className="bg-zinc-900">
              Todos
            </option>
            <option value="inconsistentes" className="bg-zinc-900">
              Só inconsistências
            </option>
          </select>

          <Button
            variant="secondary"
            size="sm"
            onPress={() => void carregarRelatorio()}
          >
            <RefreshCw className="size-4" aria-hidden />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-white">
            {relatorio.resumo.totalParticipantes}
          </p>
          <p className="text-xs text-zinc-500">Participantes</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-center">
          <p className="text-lg font-semibold text-emerald-100">
            {relatorio.resumo.completos}
          </p>
          <p className="text-xs text-emerald-200/70">Completos</p>
        </div>
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
      </div>

      {participantes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center">
          <p className="text-sm text-zinc-400">
            {filtro === 'inconsistentes'
              ? 'Nenhuma inconsistência encontrada.'
              : 'Nenhum check-in registrado ainda para este evento.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-xs text-zinc-500">
                <th className="sticky left-0 z-10 bg-zinc-900/95 px-3 py-3">
                  Participante
                </th>
                {Array.from(
                  { length: relatorio.evento.checkinDias },
                  (_, diaIndex) =>
                    relatorio.evento.pontosCheckin.map((ponto) => (
                      <th
                        key={`${diaIndex}-${ponto.id}`}
                        className="whitespace-nowrap px-3 py-3"
                      >
                        D{diaIndex + 1} · {ponto.nome}
                      </th>
                    )),
                )}
                <th className="px-3 py-3">Progresso</th>
                <th className="px-3 py-3">Status</th>
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
                  <tr
                    key={participante.ingressoId}
                    className="border-b border-white/5"
                  >
                    <td className="sticky left-0 z-10 bg-zinc-950/95 px-3 py-3 text-zinc-200">
                      <p className="font-medium">{participante.participanteNome}</p>
                      <p className="text-xs text-zinc-500">{participante.codigo}</p>
                      <p className="text-xs text-zinc-600">
                        {participante.participanteEmail}
                      </p>
                    </td>
                    {Array.from(
                      { length: relatorio.evento.checkinDias },
                      (_, diaIndex) =>
                        relatorio.evento.pontosCheckin.map((ponto) => (
                          <td
                            key={`${participante.ingressoId}-${diaIndex}-${ponto.id}`}
                            className="whitespace-nowrap px-3 py-3 text-xs text-zinc-300"
                          >
                            {celula(diaIndex + 1, ponto.id)}
                          </td>
                        )),
                    )}
                    <td className="px-3 py-3 text-xs text-zinc-400">
                      {participante.totalRegistros}/{participante.totalEsperado}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <Chip size="sm" variant="soft" color="accent">
                          {statusIngressoLabel(participante.status)}
                        </Chip>
                        {participante.inconsistencia ? (
                          <Chip size="sm" color="warning">
                            {participante.inconsistencia}
                          </Chip>
                        ) : participante.totalRegistros ===
                          participante.totalEsperado ? (
                          <Chip size="sm" color="success">
                            OK
                          </Chip>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
