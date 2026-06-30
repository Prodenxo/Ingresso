'use client'

import { Button, Input, Label } from '@heroui/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ApiError } from '@/lib/api-client'
import { getHomeRoute } from '@/lib/auth-roles'

export default function LoginPage() {
  const router = useRouter()
  const { login, user, isAuthenticated, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getHomeRoute(user))
    }
  }, [isAuthenticated, isLoading, user, router])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const loggedUser = await login({ email, senha })
      router.push(getHomeRoute(loggedUser))
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível entrar'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mesh-bg flex min-h-screen items-center justify-center p-6">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
            EventHub
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Entrar na conta
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Acesse o painel da sua empresa
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="••••••••"
              minLength={8}
              required
            />
          </div>

          {error ? (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isDisabled={isSubmitting}
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Ainda não tem conta?{' '}
          <Link
            href="/register"
            className="font-medium text-indigo-300 hover:text-indigo-200"
          >
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  )
}
