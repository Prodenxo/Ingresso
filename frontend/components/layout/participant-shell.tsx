import { ParticipantMobileNav } from '@/components/layout/participant-mobile-nav'
import { ParticipantNavbar } from '@/components/layout/participant-navbar'
import { ParticipantSidebar } from '@/components/layout/participant-sidebar'

interface ParticipantShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function ParticipantShell({
  children,
  title,
  subtitle,
}: ParticipantShellProps) {
  return (
    <div className="mesh-bg min-h-screen p-3 pb-24 md:p-6 md:pb-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1200px] gap-4 md:gap-6">
        <div className="hidden md:block">
          <ParticipantSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-6">
          <ParticipantNavbar title={title} subtitle={subtitle} />
          <main className="flex-1">{children}</main>
        </div>
      </div>

      <ParticipantMobileNav />
    </div>
  )
}
