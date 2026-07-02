'use client'

import { Button, Card } from '@heroui/react'
import { Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { FormField } from '@/components/ui/form-field'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { EventoDetalhe, PontoCheckinEvento } from '@/types/eventos'

const PONTOS_PADRAO: Array<{ ordem: number; nome: string }> = [
  { ordem: 1, nome: 'Entrada' },
  { ordem: 2, nome: 'Volta do almoço' },
  { ordem: 3, nome: 'Saída' },
]

interface EventoCheckinConfigProps {
  evento: EventoDetalhe
  onUpdated: (evento: EventoDetalhe) => void
}

export function EventoCheckinConfig({
  evento,
  onUpdated,
}: EventoCheckinConfigProps) {
  const [batePonto, setBatePonto] = useState(evento.modoCheckin === 'BATE_PONTO')
  const [dias, setDias] = useState(String(evento.checkinDias || 2))
  const [pontos, setPontos] = useState<Array<{ ordem: number; nome: string }>>(
    () =>
      evento.pontosCheckin?.length
        ? evento.pontosCheckin.map((p) => ({ ordem: p.ordem, nome: p.nome }))
        : PONTOS_PADRAO,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    setBatePonto(evento.modoCheckin === 'BATE_PONTO')
    setDias(String(evento.checkinDias || 2))
    setPontos(
      evento.pontosCheckin?.length
        ? evento.pontosCheckin.map((p) => ({ ordem: p.ordem, nome: p.nome }))
        : PONTOS_PADRAO,
    )
  }, [evento])

  function adicionarPonto() {
    setPontos((atual) => [
      ...atual,
      { ordem: atual.length + 1, nome: `Bip ${atual.length + 1}` },
    ])
  }

  function removerPonto(index: number) {
    setPontos((atual) =>
      atual
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, ordem: i + 1 })),
    )
  }

  async function salvar() {
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    const pontosLimpos = pontos
      .map((p, index) => ({
        ordem: index + 1,
        nome: p.nome.trim(),
      }))
      .filter((p) => p.nome.length >= 2)

    try {
      const atualizado = await apiFetch<EventoDetalhe>(
        `/eventos/${evento.id}/checkin-config`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            batePonto,
            dias: batePonto ? Number(dias) : 1,
            pontos: batePonto ? pontosLimpos : [{ ordem: 1, nome: 'Entrada' }],
          }),
        },
      )

      onUpdated(atualizado)
      setSuccess('Configuração de check-in salva')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar configuração')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-4">
      <h2 className="mb-1 text-sm font-medium text-white">Check-in bate-ponto</h2>
      <p className="mb-4 text-xs text-zinc-500">
        Permite vários bips por participante (entrada, almoço, saída…) ao longo dos dias.
      </p>

      <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <input
          type="checkbox"
          checked={batePonto}
          onChange={(event) => setBatePonto(event.target.checked)}
          className="size-4 rounded border-white/20"
        />
        <span className="text-sm text-white">Ativar check-in bate-ponto</span>
      </label>

      {batePonto ? (
        <div className="space-y-4">
          <FormField
            label="Quantidade de dias"
            name="checkinDias"
            type="number"
            min={1}
            max={30}
            value={dias}
            onChange={(event) => setDias(event.target.value)}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-zinc-300">Pontos de bip (por dia)</p>
              <Button size="sm" variant="secondary" onPress={adicionarPonto}>
                <Plus className="size-3.5" aria-hidden />
                Ponto
              </Button>
            </div>

            <ul className="space-y-2">
              {pontos.map((ponto, index) => (
                <li
                  key={`ponto-${index}`}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2"
                >
                  <span className="w-6 shrink-0 text-center text-xs text-zinc-500">
                    {index + 1}
                  </span>
                  <input
                    value={ponto.nome}
                    onChange={(event) =>
                      setPontos((atual) =>
                        atual.map((item, i) =>
                          i === index
                            ? { ...item, nome: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
                    placeholder="Nome do bip"
                  />
                  <button
                    type="button"
                    onClick={() => removerPonto(index)}
                    disabled={pontos.length <= 1}
                    className="rounded-lg p-2 text-zinc-500 hover:text-red-300 disabled:opacity-30"
                    aria-label="Remover ponto"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          {success}
        </p>
      ) : null}

      <Button
        variant="primary"
        className="mt-4"
        isDisabled={isSaving}
        onPress={() => void salvar()}
      >
        Salvar check-in
      </Button>
    </Card>
  )
}
