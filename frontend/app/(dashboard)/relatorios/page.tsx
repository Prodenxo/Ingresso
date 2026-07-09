'use client'

import { Button, Card, Label } from '@heroui/react'
import { BarChart3, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CheckInRelatorioPanel } from '@/components/check-in/check-in-relatorio-panel'
import { AdminShell } from '@/components/layout/admin-shell'
import { ApiError, apiFetch } from '@/lib/api-client'
import { formatEventDate } from '@/lib/ingressos-utils'
import type { EventoAdmin } from '@/types/eventos'

export default function RelatoriosPage() {
  const [eventos, setEventos] = useState<EventoAdmin[]>([])
  const [eventoId, setEventoId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadEventos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<EventoAdmin[]>('/eventos/admin')
      const batePonto = data.filter((evento) => evento.modoCheckin === 'BATE_PONTO')
      setEventos(batePonto)

      setEventoId((atual) => {
        if (atual && batePonto.some((evento) => evento.id === atual)) {
          return atual
        }

        return batePonto[0]?.id ?? ''
      })
    } catch (err) {
      setEventos([])
      setEventoId('')
      setError(
        err instanceof ApiError ? err.message : 'Erro ao carregar eventos',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEventos()
  }, [loadEventos])

  const eventoSelecionado = eventos.find((evento) => evento.id === eventoId)

  return (
    <AdminShell
      title="Relatórios"
      subtitle="Presença e bips por participante nos eventos bate-ponto"
    >
      <div className="space-y-6">
        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="evento-relatorio">Evento</Label>
              <select
                id="evento-relatorio"
                value={eventoId}
                onChange={(event) => setEventoId(event.target.value)}
                disabled={isLoading || eventos.length === 0}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
              >
                {eventos.length === 0 ? (
                  <option value="" className="bg-zinc-900">
                    Nenhum evento bate-ponto
                  </option>
                ) : (
                  eventos.map((evento) => (
                    <option key={evento.id} value={evento.id} className="bg-zinc-900">
                      {evento.nome}
                    </option>
                  ))
                )}
              </select>
              {eventoSelecionado ? (
                <p className="mt-2 text-xs text-zinc-500">
                  {formatEventDate(eventoSelecionado.dataInicio)} ·{' '}
                  {eventoSelecionado.checkinDias} dia(s) ·{' '}
                  {eventoSelecionado.pontosCheckin?.length ?? 0} bip(s) por dia
                </p>
              ) : null}
            </div>

            <Button
              variant="secondary"
              isDisabled={!eventoId}
              onPress={() => setRefreshKey((atual) => atual + 1)}
            >
              <RefreshCw className="size-4" aria-hidden />
              Atualizar
            </Button>
          </div>
        </Card>

        {error ? (
          <Card className="glass-panel rounded-2xl border-white/10 p-6">
            <p className="text-sm text-red-300">{error}</p>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="glass-panel rounded-2xl border-white/10 p-6">
            <p className="text-sm text-zinc-400">Carregando eventos...</p>
          </Card>
        ) : eventos.length === 0 ? (
          <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
              <BarChart3 className="size-5" aria-hidden />
            </div>
            <h3 className="text-lg font-medium text-white">
              Nenhum evento bate-ponto
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              Ative o check-in bate-ponto em um evento e salve a configuração
              para ver o relatório de presença aqui.
            </p>
            <Link
              href="/eventos"
              className="mt-4 inline-block text-sm text-indigo-300 hover:underline"
            >
              Ir para eventos
            </Link>
          </Card>
        ) : eventoId ? (
          <CheckInRelatorioPanel
            key={`${eventoId}-${refreshKey}`}
            eventoId={eventoId}
          />
        ) : null}
      </div>
    </AdminShell>
  )
}
