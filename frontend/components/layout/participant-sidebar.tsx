'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, LogOut, Link2, ShoppingCart, Ticket } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { getEmpresasMembro } from '@/lib/auth-roles'
import { cn } from '@/lib/utils'

export function ParticipantSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const empresasMembro = getEmpresasMembro(user)
  const temVinculo = empresasMembro.length > 0

  const navItems = [
    {
      href: '/ingressos',
      label: 'Ingressos',
      icon: ShoppingCart,
      exact: true,
    },
    {
      href: '/ingressos/meus',
      label: 'Meus ingressos',
      icon: Ticket,
      exact: false,
    },
    {
      href: '/ingressos/vincular',
      label: temVinculo ? 'Minhas empresas' : 'Vincular empresa',
      icon: temVinculo ? Building2 : Link2,
      exact: true,
    },
  ]

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

      {temVinculo ? (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Vinculado a
          </p>
          <p className="mt-1 truncate text-sm text-zinc-200">
            {empresasMembro.length === 1
              ? empresasMembro[0]!.nome
              : `${empresasMembro.length} empresas`}
          </p>
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
