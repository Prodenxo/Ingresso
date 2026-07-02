'use client'

import { Button, Card, Input, Label } from '@heroui/react'
import { Keyboard, ScanLine } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { CheckInResultCard } from '@/components/check-in/check-in-result-card'
import { CheckInScanner } from '@/components/check-in/check-in-scanner'
import { ControleEntradaPanel } from '@/components/dashboard/controle-entrada-panel'
import { CheckInShell } from '@/components/layout/check-in-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { ApiError, apiFetch } from '@/lib/api-client'
import { canFazerCheckin } from '@/lib/auth-roles'
import type { CheckInEvento, CheckInValidacao } from '@/types/check-in'

function formatEventDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function CheckInPage() {
  const { user } = useAuth()
  const [eventos, setEventos] = useState<CheckInEvento[]>([])
  const [eventoId, setEventoId] = useState('')
  const [modoManual, setModoManual] = useState(false)
  const [codigoManual, setCodigoManual] = useState('')
  const [resultado, setResultado] = useState<CheckInValidacao | null>(null)
  const [isLoadingEventos, setIsLoadingEventos] = useState(true)
  const [isValidando, setIsValidando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statsRefreshKey, setStatsRefreshKey] = useState(0)
  const [diaEvento, setDiaEvento] = useState(1)
  const [pontoCheckinId, setPontoCheckinId] = useState('')

  const podeCheckin = canFazerCheckin(user)

  useEffect(() => {
    if (!podeCheckin) {
      setIsLoadingEventos(false)
      return
    }

    void apiFetch<CheckInEvento[]>('/check-in/eventos')
      .then((data) => {
        setEventos(data)
        if (data[0]) {
          setEventoId(data[0].id)
        }
      })
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar eventos')
      })
      .finally(() => setIsLoadingEventos(false))
  }, [podeCheckin])

  useEffect(() => {
    const evento = eventos.find((item) => item.id === eventoId)
    if (!evento) return

    setDiaEvento(1)
    setPontoCheckinId(evento.pontosCheckin[0]?.id ?? '')
  }, [eventoId, eventos])

  useEffect(() => {
    if (!podeCheckin) {
      return
    }

    const interval = setInterval(() => {
      setStatsRefreshKey((atual) => atual + 1)
    }, 15000)

    return () => clearInterval(interval)
  }, [podeCheckin])

  const validarCodigo = useCallback(
    async (codigo: string) => {
      if (!eventoId || !codigo.trim()) {
        return
      }

      setIsValidando(true)
      setError(null)

      try {
        const eventoAtual = eventos.find((item) => item.id === eventoId)
        const body: Record<string, string | number> = {
          codigo: codigo.trim().toUpperCase(),
          eventoId,
        }

        if (eventoAtual?.modoCheckin === 'BATE_PONTO') {
          if (!pontoCheckinId) {
            setError('Selecione o ponto de check-in')
            return
          }
          body.diaEvento = diaEvento
          body.pontoCheckinId = pontoCheckinId
        }

        const response = await apiFetch<CheckInValidacao>('/check-in/validar', {
          method: 'POST',
          body: JSON.stringify(body),
        })

        setResultado(response)

        if (response.resultado === 'VALIDO') {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate(200)
          }

          setStatsRefreshKey((atual) => atual + 1)

          setEventos((atual) =>
            atual.map((evento) =>
              evento.id === eventoId
                ? {
                    ...evento,
                    checkinsRealizados: evento.checkinsRealizados + 1,
                  }
                : evento,
            ),
          )
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Erro ao validar ingresso')
      } finally {
        setIsValidando(false)
      }
    },
    [eventoId, eventos, diaEvento, pontoCheckinId],
  )

  const eventoSelecionado = eventos.find((evento) => evento.id === eventoId)
  const isBatePonto = eventoSelecionado?.modoCheckin === 'BATE_PONTO'

  if (!podeCheckin) {
    return (
      <CheckInShell title="Check-in" subtitle="Validador de ingressos">
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">
            Você não tem permissão para realizar check-in.
          </p>
        </Card>
      </CheckInShell>
    )
  }

  return (
    <CheckInShell
      title="Validador"
      subtitle={eventoSelecionado?.nome ?? 'Selecione o evento'}
    >
      <div className="space-y-4">
        <Card className="glass-panel rounded-2xl border-white/10 p-4">
          <div className="space-y-3">
            <div>
              <Label htmlFor="evento-checkin">Evento</Label>
              <select
                id="evento-checkin"
                value={eventoId}
                onChange={(event) => {
                  setEventoId(event.target.value)
                  setResultado(null)
                }}
                disabled={isLoadingEventos || eventos.length === 0}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
              >
                {eventos.length === 0 ? (
                  <option value="">Nenhum evento disponível</option>
                ) : (
                  eventos.map((evento) => (
                    <option key={evento.id} value={evento.id} className="bg-zinc-900">
                      {evento.nome}
                    </option>
                  ))
                )}
              </select>
            </div>

            {eventoSelecionado ? (
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>{formatEventDate(eventoSelecionado.dataInicio)}</span>
                <span>{eventoSelecionado.checkinsRealizados} check-ins</span>
              </div>
            ) : null}

            {isBatePonto && eventoSelecionado ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dia-checkin">Dia</Label>
                  <select
                    id="dia-checkin"
                    value={diaEvento}
                    onChange={(event) => {
                      setDiaEvento(Number(event.target.value))
                      setResultado(null)
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
                  >
                    {Array.from({ length: eventoSelecionado.checkinDias }, (_, i) => (
                      <option key={i + 1} value={i + 1} className="bg-zinc-900">
                        Dia {i + 1}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="ponto-checkin">Bip</Label>
                  <select
                    id="ponto-checkin"
                    value={pontoCheckinId}
                    onChange={(event) => {
                      setPontoCheckinId(event.target.value)
                      setResultado(null)
                    }}
                    className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50"
                  >
                    {eventoSelecionado.pontosCheckin.map((ponto) => (
                      <option key={ponto.id} value={ponto.id} className="bg-zinc-900">
                        {ponto.ordem}. {ponto.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {resultado ? <CheckInResultCard result={resultado} /> : null}

        {!modoManual && eventoId && !resultado ? (
          <CheckInScanner
            active={!isValidando && Boolean(eventoId)}
            onScan={(codigo) => void validarCodigo(codigo)}
          />
        ) : null}

        {modoManual ? (
          <Card className="glass-panel rounded-2xl border-white/10 p-4">
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault()
                void validarCodigo(codigoManual)
              }}
            >
              <div>
                <Label htmlFor="codigo-manual">Código do ingresso</Label>
                <Input
                  id="codigo-manual"
                  value={codigoManual}
                  onChange={(event) =>
                    setCodigoManual(event.target.value.toUpperCase())
                  }
                  placeholder="EH-XXXXXXXXXXXX"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" variant="primary" isDisabled={isValidando}>
                {isValidando ? 'Validando...' : 'Validar'}
              </Button>
            </form>
          </Card>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onPress={() => setModoManual((atual) => !atual)}
        >
          {modoManual ? (
            <>
              <ScanLine className="size-4" aria-hidden />
              Usar câmera
            </>
          ) : (
            <>
              <Keyboard className="size-4" aria-hidden />
              Digitar código manualmente
            </>
          )}
        </Button>

        {resultado ? (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onPress={() => {
              setResultado(null)
              setCodigoManual('')
            }}
          >
            Próximo ingresso
          </Button>
        ) : null}

        <ControleEntradaPanel refreshKey={statsRefreshKey} />
      </div>
    </CheckInShell>
  )
}
