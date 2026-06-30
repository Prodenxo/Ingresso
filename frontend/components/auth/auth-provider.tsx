'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchCurrentUser,
  loginRequest,
  logoutRequest,
  registerRequest,
} from '@/lib/api-client'
import { getAccessToken } from '@/lib/auth-storage'
import type {
  AuthUser,
  LoginInput,
  RegisterInput,
} from '@/types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (input: LoginInput) => Promise<AuthUser>
  register: (input: RegisterInput) => Promise<AuthUser>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getAccessToken()

    if (!token) {
      setUser(null)
      return
    }

    const currentUser = await fetchCurrentUser()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        await refreshUser()
      } catch {
        if (active) {
          setUser(null)
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [refreshUser])

  const login = useCallback(async (input: LoginInput) => {
    const session = await loginRequest(input.email, input.senha)
    setUser(session.user)
    return session.user
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const payload: Record<string, string> = {
      tipo: input.tipo,
      nome: input.nome,
      email: input.email,
      senha: input.senha,
    }

    if (input.telefone) {
      payload.telefone = input.telefone
    }

    if (input.tipo === 'empresa') {
      payload.nomeEmpresa = input.nomeEmpresa ?? ''
      payload.razaoSocial = input.razaoSocial ?? ''
      payload.cnpj = (input.cnpj ?? '').replace(/\D/g, '')
    }

    const session = await registerRequest(payload)
    setUser(session.user)
    return session.user
  }, [])

  const logout = useCallback(() => {
    logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }

  return context
}
