'use client'

import { Avatar, Button, Chip } from '@heroui/react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { getTipoContaLabel } from '@/lib/auth-roles'

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

  return (
    <header className="glass-panel flex items-center justify-between gap-4 rounded-2xl px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <Chip size="sm" variant="soft" color="accent">
            {getTipoContaLabel(user.tipoConta)}
          </Chip>
        ) : null}

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
