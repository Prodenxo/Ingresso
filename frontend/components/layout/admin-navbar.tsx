'use client'

import { Avatar, Button, Chip } from '@heroui/react'
import { Bell, LogOut, Search } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { EmpresaSwitcher } from '@/components/empresa/empresa-switcher'
import { useEmpresa } from '@/components/empresa/empresa-provider'
import { getTipoContaLabel } from '@/lib/auth-roles'

interface AdminNavbarProps {
  title: string
  subtitle?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function AdminNavbar({ title, subtitle }: AdminNavbarProps) {
  const { user, logout } = useAuth()
  const { empresaAtiva, isSuperAdmin } = useEmpresa()
  const empresaNome = isSuperAdmin
    ? empresaAtiva?.nome
    : user?.empresas[0]?.nome

  return (
    <header className="glass-panel flex flex-col gap-4 rounded-2xl px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-zinc-400">{subtitle}</p>
        ) : null}
        {empresaNome ? (
          <p className="mt-1 text-xs text-zinc-500">
            {isSuperAdmin ? 'Operando como: ' : ''}
            {empresaNome}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <EmpresaSwitcher />
        {user ? (
          <Chip
            size="sm"
            variant="soft"
            color={user.tipoConta === 'SUPERADMIN' ? 'warning' : 'accent'}
          >
            {getTipoContaLabel(user.tipoConta)}
          </Chip>
        ) : null}

        <label className="relative hidden sm:block">
          <span className="sr-only">Buscar</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-500"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Buscar eventos, pedidos..."
            className="w-64 rounded-xl border border-white/10 bg-white/5 py-2 pr-3 pl-10 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-indigo-500/50"
          />
        </label>

        <button
          type="button"
          className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-zinc-300 transition hover:bg-white/10"
          aria-label="Notificações"
        >
          <Bell className="size-4" />
        </button>

        <Avatar.Root className="size-9">
          <Avatar.Fallback>
            {user ? getInitials(user.nome) : 'EH'}
          </Avatar.Fallback>
        </Avatar.Root>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onPress={logout}
          aria-label="Sair da conta"
        >
          <LogOut className="size-4" aria-hidden />
        </Button>
      </div>
    </header>
  )
}
