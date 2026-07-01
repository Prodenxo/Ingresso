'use client'

import { Avatar, Button } from '@heroui/react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { getEmpresasVinculadasLabel } from '@/lib/participant-nav-items'

interface ParticipantNavbarProps {
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

export function ParticipantNavbar({ title, subtitle }: ParticipantNavbarProps) {
  const { user, logout } = useAuth()
  const empresaLabel = getEmpresasVinculadasLabel(user)

  return (
    <header className="glass-panel rounded-2xl px-4 py-3 md:px-5 md:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500 md:hidden">
            EventHub
          </p>
          <h2 className="truncate text-base font-semibold text-white md:text-lg">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400 md:text-sm">
              {subtitle}
            </p>
          ) : null}
          {empresaLabel ? (
            <p className="mt-1 truncate text-[11px] text-indigo-300/80 md:hidden">
              {empresaLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Avatar.Root className="size-8 md:size-9">
            <Avatar.Fallback className="text-xs">
              {user ? getInitials(user.nome) : 'EH'}
            </Avatar.Fallback>
          </Avatar.Root>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={logout}
            aria-label="Sair da conta"
            className="md:hidden"
          >
            <LogOut className="size-4" aria-hidden />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={logout}
            aria-label="Sair da conta"
            className="hidden md:inline-flex"
          >
            <LogOut className="size-4" aria-hidden />
          </Button>
        </div>
      </div>
    </header>
  )
}
