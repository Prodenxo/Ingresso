'use client'

import { Button, Card, Input, Label } from '@heroui/react'
import { Link2 } from 'lucide-react'
import { useState } from 'react'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { VincularMembroResponse } from '@/types/membros'

interface VincularCodigoCardProps {
  titulo?: string
  descricao?: string
  onSuccess?: () => void
}

export function VincularCodigoCard({
  titulo = 'Entrar com código',
  descricao = 'Recebeu um código da empresa? Digite abaixo para liberar o acesso.',
  onSuccess,
}: VincularCodigoCardProps) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const result = await apiFetch<VincularMembroResponse>('/membros/vincular', {
        method: 'POST',
        body: JSON.stringify({ codigo: codigo.trim().toUpperCase() }),
      })
      setSuccess(
        result.jaVinculado
          ? `Você já está vinculado à ${result.empresa.nome}`
          : `Vinculado à ${result.empresa.nome} com sucesso`,
      )
      setCodigo('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Código inválido')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
          <Link2 className="size-5" aria-hidden />
        </div>
        <div>
          <h3 className="font-medium text-white">{titulo}</h3>
          <p className="mt-1 text-sm text-zinc-400">{descricao}</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {success}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="codigo-convite">Código de convite</Label>
          <Input
            id="codigo-convite"
            name="codigo"
            value={codigo}
            onChange={(event) => setCodigo(event.target.value.toUpperCase())}
            placeholder="Ex: ACAD7X2K"
            autoComplete="off"
            required
          />
        </div>

        <Button type="submit" variant="primary" isDisabled={isLoading}>
          {isLoading ? 'Vinculando...' : 'Vincular empresa'}
        </Button>
      </form>

      <p className="mt-4 text-xs text-zinc-500">
        Também funciona pelo link de convite enviado pela empresa (ex.:{' '}
        <span className="text-zinc-400">/entrar/nome-da-empresa</span>).
      </p>
    </Card>
  )
}
