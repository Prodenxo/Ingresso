'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface CheckInShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function CheckInShell({ children, title, subtitle }: CheckInShellProps) {
  return (
    <div className="mesh-bg min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-zinc-300 transition hover:bg-white/10"
            aria-label="Voltar ao painel"
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-white">{title}</h1>
            {subtitle ? (
              <p className="truncate text-xs text-zinc-400">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4 pb-8">{children}</main>
    </div>
  )
}
