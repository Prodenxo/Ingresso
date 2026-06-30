'use client'

import { AuthGuard } from '@/components/auth/auth-guard'
import { AdminRoleGuard } from '@/components/auth/admin-role-guard'

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <AdminRoleGuard>{children}</AdminRoleGuard>
    </AuthGuard>
  )
}
