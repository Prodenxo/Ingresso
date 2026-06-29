import { AdminNavbar } from '@/components/layout/admin-navbar'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

interface AdminShellProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AdminShell({ children, title, subtitle }: AdminShellProps) {
  return (
    <div className="mesh-bg min-h-screen p-4 md:p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1600px] gap-4 md:gap-6">
        <div className="hidden md:block">
          <AdminSidebar />
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4 md:gap-6">
          <AdminNavbar title={title} subtitle={subtitle} />
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </div>
  )
}
