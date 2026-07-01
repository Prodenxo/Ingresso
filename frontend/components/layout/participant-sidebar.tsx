'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import {
  getEmpresasVinculadasLabel,
  getParticipantNavItems,
} from '@/lib/participant-nav-items'
import { cn } from '@/lib/utils'

export function ParticipantSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const navItems = getParticipantNavItems(user)
  const empresaLabel = getEmpresasVinculadasLabel(user)

  return (
    <aside className="glass-panel flex h-full w-64 shrink-0 flex-col rounded-2xl p-4">
      <div className="mb-8 px-2">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          EventHub
        </p>
        <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-xl font-semibold text-transparent">
          Minha conta
        </h1>
      </div>

      {empresaLabel ? (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Vinculado a
          </p>
          <p className="mt-1 truncate text-sm text-zinc-200">{empresaLabel}</p>
        </div>
      ) : null}

      <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação da conta">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`)

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
      >
        <LogOut className="size-4" aria-hidden />
        Sair
      </button>
    </aside>
  )
}
