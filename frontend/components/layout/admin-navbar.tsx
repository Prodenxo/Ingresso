'use client'

import { Avatar } from '@heroui/react'
import { Bell, Search } from 'lucide-react'

interface AdminNavbarProps {
  title: string
  subtitle?: string
}

export function AdminNavbar({ title, subtitle }: AdminNavbarProps) {
  return (
    <header className="glass-panel flex items-center justify-between gap-4 rounded-2xl px-5 py-4">
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? (
          <p className="text-sm text-zinc-400">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
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
          <Avatar.Fallback>EH</Avatar.Fallback>
        </Avatar.Root>
      </div>
    </header>
  )
}
