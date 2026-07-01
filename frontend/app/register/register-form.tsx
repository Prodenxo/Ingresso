'use client'

import { Button, Input, Label } from '@heroui/react'
import { Building2, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { ApiError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { getHomeRoute } from '@/lib/auth-roles'
import type { RegisterTipo } from '@/types/auth'

const accountTypes: Array<{
  value: RegisterTipo
  label: string
  description: string
  icon: typeof UserRound
}> = [
  {
    value: 'usuario',
    label: 'Usuário',
    description: 'Comprar ingressos e acompanhar eventos',
    icon: UserRound,
  },
  {
    value: 'empresa',
    label: 'Empresa',
    description: 'Organizar eventos e vender ingressos',
    icon: Building2,
  },
]

export function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const { register, user, isAuthenticated, isLoading } = useAuth()
  const [tipo, setTipo] = useState<RegisterTipo>('usuario')
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    nomeEmpresa: '',
    razaoSocial: '',
    cnpj: '',
    telefone: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loginHref = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : '/login'

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(redirectTo ?? getHomeRoute(user))
    }
  }, [isAuthenticated, isLoading, user, router, redirectTo])

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const registeredUser = await register({
        tipo,
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        telefone: form.telefone || undefined,
        ...(tipo === 'empresa'
          ? {
              nomeEmpresa: form.nomeEmpresa,
              razaoSocial: form.razaoSocial,
              cnpj: form.cnpj,
            }
          : {}),
      })
      router.push(redirectTo ?? getHomeRoute(registeredUser))
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Não foi possível criar a conta'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mesh-bg flex min-h-screen items-center justify-center p-4 pb-8">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 sm:p-8">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-indigo-400">
            EventHub
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Criar conta
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Escolha como deseja se cadastrar na plataforma
          </p>
        </div>

        <div
          className={cn(
            'mx-auto mb-6 grid w-full grid-cols-2 gap-3',
            tipo === 'empresa' ? 'max-w-xl' : 'max-w-md',
          )}
          role="radiogroup"
          aria-label="Tipo de cadastro"
        >
          {accountTypes.map(({ value, label, description, icon: Icon }) => {
            const selected = tipo === value

            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setTipo(value)}
                className={cn(
                  'rounded-xl border p-4 text-left transition',
                  selected
                    ? 'border-indigo-500/60 bg-indigo-500/10'
                    : 'border-white/10 bg-white/3 hover:bg-white/5',
                )}
              >
                <div className="mb-2 flex items-center gap-2">
                  <Icon
                    className={cn(
                      'size-4',
                      selected ? 'text-indigo-300' : 'text-zinc-400',
                    )}
                    aria-hidden
                  />
                  <span className="font-medium text-white">{label}</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  {description}
                </p>
              </button>
            )
          })}
        </div>

        <form
          className={cn(
            'mx-auto w-full flex flex-col gap-4',
            tipo === 'empresa' ? 'max-w-xl' : 'max-w-md',
          )}
          onSubmit={handleSubmit}
        >
          <div className="w-full space-y-2">
            <Label htmlFor="nome">
              {tipo === 'empresa' ? 'Nome do responsável' : 'Seu nome'}
            </Label>
            <Input
              id="nome"
              className="w-full"
              value={form.nome}
              onChange={(event) => updateField('nome', event.target.value)}
              placeholder={
                tipo === 'empresa' ? 'Nome do administrador' : 'Maria Silva'
              }
              required
            />
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              className="w-full"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              placeholder="voce@email.com"
              required
            />
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              className="w-full"
              type="password"
              autoComplete="new-password"
              value={form.senha}
              onChange={(event) => updateField('senha', event.target.value)}
              placeholder="Mínimo 8 caracteres"
              minLength={8}
              required
            />
          </div>

          <div className="w-full space-y-2">
            <Label htmlFor="telefone">Telefone (opcional)</Label>
            <Input
              id="telefone"
              className="w-full"
              value={form.telefone}
              onChange={(event) => updateField('telefone', event.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          {tipo === 'empresa' ? (
            <>
              <div className="flex w-full items-center justify-center gap-2 pt-2 text-sm text-zinc-400">
                <Building2 className="size-4" aria-hidden />
                Dados da empresa
              </div>

              <div className="grid w-full gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome fantasia</Label>
                  <Input
                    id="nomeEmpresa"
                    className="w-full"
                    value={form.nomeEmpresa}
                    onChange={(event) =>
                      updateField('nomeEmpresa', event.target.value)
                    }
                    placeholder="Eventos ABC"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão social</Label>
                  <Input
                    id="razaoSocial"
                    className="w-full"
                    value={form.razaoSocial}
                    onChange={(event) =>
                      updateField('razaoSocial', event.target.value)
                    }
                    placeholder="Eventos ABC Ltda"
                    required
                  />
                </div>
              </div>

              <div className="w-full space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  className="w-full"
                  inputMode="numeric"
                  value={form.cnpj}
                  onChange={(event) => updateField('cnpj', event.target.value)}
                  placeholder="00000000000000"
                  required
                />
              </div>
            </>
          ) : null}

          {error ? (
            <p className="w-full rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isDisabled={isSubmitting}
          >
            {isSubmitting
              ? 'Criando conta...'
              : tipo === 'empresa'
                ? 'Criar conta da empresa'
                : 'Criar conta de usuário'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Já tem conta?{' '}
          <Link
            href={loginHref}
            className="font-medium text-indigo-300 hover:text-indigo-200"
          >
            Entrar
          </Link>
        </p>
      </div>
    </main>
  )
}
