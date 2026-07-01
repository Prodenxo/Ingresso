'use client'

import { Button, Card, Chip } from '@heroui/react'
import { Trash2, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { MembroVinculado } from '@/types/membros'

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function MembrosVinculadosPanel() {
  const [membros, setMembros] = useState<MembroVinculado[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [removendoId, setRemovendoId] = useState<string | null>(null)

  const loadMembros = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<MembroVinculado[]>('/membros')
      setMembros(data)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os membros vinculados',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMembros()
  }, [loadMembros])

  async function handleRemover(membro: MembroVinculado) {
    if (
      !window.confirm(
        `Remover o vínculo de ${membro.nome}? A pessoa perderá acesso aos eventos exclusivos da empresa.`,
      )
    ) {
      return
    }

    setRemovendoId(membro.id)
    setError(null)
    setSuccess(null)

    try {
      await apiFetch(`/membros/${membro.id}`, { method: 'DELETE' })
      setMembros((atual) => atual.filter((item) => item.id !== membro.id))
      setSuccess(`${membro.nome} removido da lista de membros`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover membro')
    } finally {
      setRemovendoId(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-zinc-400">Carregando membros vinculados...</p>
      </Card>
    )
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-6 md:p-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-white">Membros vinculados</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Participantes que entraram pelo link ou código de convite.
          </p>
        </div>
        <Chip size="sm" variant="soft" color="accent">
          {membros.length}
        </Chip>
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}

      {membros.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
            <Users className="size-5" aria-hidden />
          </div>
          <p className="text-sm text-zinc-300">Nenhum membro vinculado ainda</p>
          <p className="mt-1 text-xs text-zinc-500">
            Quando alguém usar o convite, aparecerá aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-2" aria-label="Lista de membros vinculados">
          {membros.map((membro) => (
            <li
              key={membro.id}
              className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{membro.nome}</p>
                <p className="truncate text-sm text-zinc-400">{membro.email}</p>
                {membro.telefone ? (
                  <p className="text-xs text-zinc-500">{membro.telefone}</p>
                ) : null}
                <p className="mt-1 text-xs text-zinc-500">
                  Vinculado em {formatDateTime(membro.vinculadoEm)}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 text-red-300 hover:text-red-200"
                isDisabled={removendoId === membro.id}
                onPress={() => void handleRemover(membro)}
              >
                <Trash2 className="size-4" aria-hidden />
                {removendoId === membro.id ? 'Removendo...' : 'Remover'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
