'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import {
  getAdminMobilePrimaryNav,
  getAdminMobileSecondaryNav,
} from '@/lib/admin-nav-items'
import { cn } from '@/lib/utils'

export function AdminMobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (pathname.startsWith('/check-in')) {
    return null
  }

  const primaryItems = getAdminMobilePrimaryNav(user)
  const secondaryItems = getAdminMobileSecondaryNav(user)

  return (
    <>
      {menuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      ) : null}

      {menuOpen ? (
        <div className="fixed inset-x-4 bottom-20 z-50 rounded-2xl border border-white/10 bg-zinc-900/95 p-3 shadow-2xl backdrop-blur-xl md:hidden">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-sm font-medium text-white">Menu</p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-white/10"
              aria-label="Fechar menu"
            >
              <X className="size-4" />
            </button>
          </div>
          <nav className="grid grid-cols-2 gap-2" aria-label="Menu completo">
            {secondaryItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`)

              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl px-3 py-3 text-sm',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-zinc-300 hover:bg-white/5',
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/90 px-2 py-2 backdrop-blur-xl md:hidden"
        aria-label="Navegação mobile"
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(`${href}/`)
            const isCheckin = href === '/check-in'

            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors',
                    isActive
                      ? isCheckin
                        ? 'bg-indigo-500/20 text-indigo-200'
                        : 'bg-white/10 text-white'
                      : isCheckin
                        ? 'text-indigo-300'
                        : 'text-zinc-400',
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {label}
                </Link>
              </li>
            )
          })}

          {secondaryItems.length > 0 ? (
            <li className="flex-1">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className={cn(
                  'flex w-full flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors',
                  menuOpen ? 'bg-white/10 text-white' : 'text-zinc-400',
                )}
              >
                <Menu className="size-5" aria-hidden />
                Menu
              </button>
            </li>
          ) : null}
        </ul>
      </nav>
    </>
  )
}
