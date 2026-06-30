'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { isPainelAdmin } from '@/lib/auth-roles'

interface AdminRoleGuardProps {
  children: ReactNode
}

export function AdminRoleGuard({ children }: AdminRoleGuardProps) {
  const router = useRouter()
  const { user, isLoading, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPainelAdmin(user)) {
      router.replace('/ingressos')
    }
  }, [user, isLoading, isAuthenticated, router])

  if (isLoading) {
    return null
  }

  if (!isPainelAdmin(user)) {
    return null
  }

  return children
}
