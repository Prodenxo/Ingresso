'use client'

import { Button, Card } from '@heroui/react'
import { Building2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ApiError, apiFetch } from '@/lib/api-client'
import { isPainelAdmin } from '@/lib/auth-roles'
import type { ConviteEmpresaPublico, VincularMembroResponse } from '@/types/membros'

export default function EntrarEmpresaPage() {
  const params = useParams<{ slug: string }>()
  const slug = params.slug
  const router = useRouter()
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const [empresa, setEmpresa] = useState<ConviteEmpresaPublico | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isFetching, setIsFetching] = useState(true)
  const [isVinculando, setIsVinculando] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  const loadConvite = useCallback(async () => {
    setIsFetching(true)
    setError(null)

    try {
      const data = await apiFetch<ConviteEmpresaPublico>(
        `/membros/convite/${encodeURIComponent(slug)}`,
      )
      setEmpresa(data)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Convite não encontrado',
      )
    } finally {
      setIsFetching(false)
    }
  }, [slug])

  useEffect(() => {
    void loadConvite()
  }, [loadConvite])

  async function handleVincular() {
    if (!empresa) return

    setIsVinculando(true)
    setError(null)

    try {
      const result = await apiFetch<VincularMembroResponse>('/membros/vincular', {
        method: 'POST',
        body: JSON.stringify({ slug: empresa.slugMembro }),
      })
      await refreshUser()
      setSuccess(result.message)
      setTimeout(() => {
        router.replace('/ingressos')
      }, 1200)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao vincular')
    } finally {
      setIsVinculando(false)
    }
  }

  const loginHref = `/login?redirect=${encodeURIComponent(`/entrar/${slug}`)}`
  const registerHref = `/register?redirect=${encodeURIComponent(`/entrar/${slug}`)}`

  return (
    <div className="mesh-bg flex min-h-screen items-center justify-center p-4">
      <Card className="glass-panel w-full max-w-md rounded-2xl border-white/10 p-6 md:p-8">
        {isFetching ? (
          <div className="flex items-center justify-center gap-2 py-8 text-zinc-400">
            <Loader2 className="size-5 animate-spin" aria-hidden />
            Carregando convite...
          </div>
        ) : error && !empresa ? (
          <div className="text-center">
            <h1 className="text-lg font-medium text-white">Convite inválido</h1>
            <p className="mt-2 text-sm text-zinc-400">{error}</p>
            <Link
              href="/login"
              className="mt-6 inline-flex rounded-xl px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              Ir para login
            </Link>
          </div>
        ) : empresa ? (
          <div className="space-y-6 text-center">
            <div
              className="mx-auto flex size-16 items-center justify-center rounded-2xl"
              style={{ backgroundColor: `${empresa.corPrimaria}22` }}
            >
              <Building2
                className="size-8"
                style={{ color: empresa.corPrimaria }}
                aria-hidden
              />
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Convite para
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                {empresa.nome}
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Entre ou crie sua conta para acessar ingressos e conteúdos
                exclusivos desta empresa.
              </p>
            </div>

            {success ? (
              <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {success}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            {!user ? (
              <div className="flex flex-col gap-3">
                <Link href={loginHref} className="block">
                  <Button variant="primary" className="w-full">
                    Entrar na minha conta
                  </Button>
                </Link>
                <Link href={registerHref} className="block">
                  <Button variant="ghost" className="w-full">
                    Criar conta
                  </Button>
                </Link>
              </div>
            ) : isPainelAdmin(user) ? (
              <p className="text-sm text-zinc-400">
                Contas de organizador usam o painel admin. Acesse com uma conta
                de participante para entrar como membro.
              </p>
            ) : isVinculando ? (
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-400">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Vinculando à empresa...
              </div>
            ) : (
              <Button variant="primary" onPress={() => void handleVincular()}>
                Entrar em {empresa.nome}
              </Button>
            )}
          </div>
        ) : null}
      </Card>
    </div>
  )
}
