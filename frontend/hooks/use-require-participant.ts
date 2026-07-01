'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { isPainelAdmin } from '@/lib/auth-roles'

export function useRequireParticipant() {
  const router = useRouter()
  const { user, isLoading, refreshUser } = useAuth()

  useEffect(() => {
    if (!isLoading && user && isPainelAdmin(user)) {
      router.replace('/dashboard')
    }
  }, [user, isLoading, router])

  const isReady = !isLoading && Boolean(user) && !isPainelAdmin(user)

  return { user, isLoading, isReady, refreshUser }
}
