'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Ticket,
  Users,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { canGerenciarConviteMembros, canFazerCheckin } from '@/lib/auth-roles'
import { cn } from '@/lib/utils'

const baseNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eventos', label: 'Eventos', icon: CalendarDays },
  { href: '/ingressos', label: 'Ingressos', icon: Ticket },
  { href: '/check-in', label: 'Check-in', icon: QrCode, requiresCheckin: true },
  { href: '/financeiro', label: 'Financeiro', icon: Wallet },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/membros', label: 'Membros', icon: Users, requiresMembros: true },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const navItems = baseNavItems.filter((item) => {
    if (item.requiresMembros && !canGerenciarConviteMembros(user)) {
      return false
    }

    if (item.requiresCheckin && !canFazerCheckin(user)) {
      return false
    }

    return true
  })

  return (
    <aside className="glass-panel flex h-full w-64 shrink-0 flex-col rounded-2xl p-4">
      <div className="mb-8 px-2">
        <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          EventHub
        </p>
        <h1 className="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-xl font-semibold text-transparent">
          Painel Admin
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1" aria-label="Navegação principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)

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
        className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
      >
        <LogOut className="size-4" aria-hidden />
        Sair
      </button>
    </aside>
  )
}
