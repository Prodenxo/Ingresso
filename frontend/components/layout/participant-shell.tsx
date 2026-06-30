import { ParticipantSidebar } from '@/components/layout/participant-sidebar'
import { ParticipantNavbar } from '@/components/layout/participant-navbar'

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
    <div className="mesh-bg min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1200px] gap-4 md:gap-6">
        <div className="hidden md:block">
          <ParticipantSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
          <ParticipantNavbar title={title} subtitle={subtitle} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
