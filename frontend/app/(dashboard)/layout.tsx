'use client'

import { AuthGuard } from '@/components/auth/auth-guard'
import { AdminRoleGuard } from '@/components/auth/admin-role-guard'
import { EmpresaProvider, useEmpresa } from '@/components/empresa/empresa-provider'

function DashboardEmpresaScope({ children }: { children: React.ReactNode }) {
  const { empresaAtivaId } = useEmpresa()

  return (
    <AdminRoleGuard>
      <div key={empresaAtivaId ?? 'default'} className="contents">
        {children}
      </div>
    </AdminRoleGuard>
  )
}

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <EmpresaProvider>
        <DashboardEmpresaScope>{children}</DashboardEmpresaScope>
      </EmpresaProvider>
    </AuthGuard>
  )
}
