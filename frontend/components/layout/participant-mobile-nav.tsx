'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { getParticipantNavItems } from '@/lib/participant-nav-items'
import { cn } from '@/lib/utils'

export function ParticipantMobileNav() {
  const pathname = usePathname()
  const { user } = useAuth()
  const navItems = getParticipantNavItems(user).filter((item) => item.mobilePrimary)

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-zinc-950/90 px-2 py-2 backdrop-blur-xl md:hidden"
      aria-label="Navegação mobile"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around gap-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`)
          const isMeus = href === '/ingressos/meus'

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors',
                  isActive
                    ? isMeus
                      ? 'bg-emerald-500/20 text-emerald-200'
                      : 'bg-white/10 text-white'
                    : isMeus
                      ? 'text-emerald-300/80'
                      : 'text-zinc-400',
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
