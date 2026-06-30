'use client'

import { Spinner } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="mesh-bg flex min-h-screen items-center justify-center">
        <div className="glass-panel flex flex-col items-center gap-3 rounded-2xl px-8 py-10">
          <Spinner size="lg" />
          <p className="text-sm text-zinc-400">Carregando sessão...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return children
}
