'use client'

import { AuthGuard } from '@/components/auth/auth-guard'

export default function IngressosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthGuard>{children}</AuthGuard>
}
