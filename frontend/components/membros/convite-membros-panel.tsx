'use client'

import { Button, Card } from '@heroui/react'
import { Copy, Link2, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { ConviteConfig } from '@/types/membros'

export function ConviteMembrosPanel() {
  const [config, setConfig] = useState<ConviteConfig | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const loadConfig = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<ConviteConfig>('/membros/convite-config')
      setConfig(data)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar o convite de membros',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConfig()
  }, [loadConfig])

  const inviteUrl =
    config && origin ? `${origin}/entrar/${config.slugMembro}` : ''

  async function handleCopy(text: string, label: string) {
    await navigator.clipboard.writeText(text)
    setSuccess(`${label} copiado`)
    setTimeout(() => setSuccess(null), 2000)
  }

  async function handleRegenerar() {
    if (
      !window.confirm(
        'Gerar um novo código invalida o anterior. Membros que ainda não entraram precisarão do novo código.',
      )
    ) {
      return
    }

    setIsRegenerating(true)
    setError(null)

    try {
      const data = await apiFetch<ConviteConfig>(
        '/membros/convite/regenerar-codigo',
        { method: 'POST' },
      )
      setConfig(data)
      setSuccess('Novo código gerado')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao regenerar código')
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-zinc-400">Carregando convite de membros...</p>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-red-300">{error ?? 'Convite indisponível'}</p>
      </Card>
    )
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-6 md:p-8">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-white">Convite de membros</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Compartilhe o link ou código para que alunos acessem ingressos e conteúdos
          exclusivos da sua empresa.
        </p>
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

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Link de convite
          </p>
          <p className="mt-2 break-all rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-sm text-zinc-200">
            {inviteUrl}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            onPress={() => void handleCopy(inviteUrl, 'Link')}
          >
            <Copy className="size-4" aria-hidden />
            Copiar link
          </Button>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Código alternativo
          </p>
          <p className="mt-2 font-mono text-2xl tracking-widest text-white">
            {config.codigoConvite}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onPress={() => void handleCopy(config.codigoConvite, 'Código')}
            >
              <Copy className="size-4" aria-hidden />
              Copiar código
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isDisabled={isRegenerating}
              onPress={() => void handleRegenerar()}
            >
              <RefreshCw className="size-4" aria-hidden />
              {isRegenerating ? 'Gerando...' : 'Novo código'}
            </Button>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-zinc-500">
          <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Somente usuários vinculados enxergam eventos e ingressos desta empresa.
        </p>
      </div>
    </Card>
  )
}
