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
import { useAuth } from '@/components/auth/auth-provider'
import { apiFetch } from '@/lib/api-client'
import {
  clearEmpresaAtivaId,
  getEmpresaAtivaId,
  setEmpresaAtivaId,
} from '@/lib/empresa-context-storage'
import type { EmpresaResumo } from '@/types/empresa'

interface EmpresaContextValue {
  empresas: EmpresaResumo[]
  empresaAtiva: EmpresaResumo | null
  empresaAtivaId: string | null
  isLoading: boolean
  isSuperAdmin: boolean
  setEmpresaAtiva: (empresaId: string) => void
  refreshEmpresas: () => Promise<void>
}

const EmpresaContext = createContext<EmpresaContextValue | null>(null)

interface EmpresaProviderProps {
  children: ReactNode
}

export function EmpresaProvider({ children }: EmpresaProviderProps) {
  const { user } = useAuth()
  const isSuperAdmin = user?.tipoConta === 'SUPERADMIN'
  const [empresas, setEmpresas] = useState<EmpresaResumo[]>([])
  const [empresaAtivaId, setEmpresaAtivaIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const refreshEmpresas = useCallback(async () => {
    if (!user) {
      setEmpresas([])
      setEmpresaAtivaIdState(null)
      clearEmpresaAtivaId()
      return
    }

    if (isSuperAdmin) {
      setIsLoading(true)
      try {
        const lista = await apiFetch<EmpresaResumo[]>('/empresas')
        setEmpresas(lista)

        const stored = getEmpresaAtivaId()
        const ativa =
          lista.find((empresa) => empresa.id === stored) ?? lista[0] ?? null

        if (ativa) {
          setEmpresaAtivaId(ativa.id)
          setEmpresaAtivaIdState(ativa.id)
        } else {
          clearEmpresaAtivaId()
          setEmpresaAtivaIdState(null)
        }
      } catch {
        setEmpresas([])
        setEmpresaAtivaIdState(null)
      } finally {
        setIsLoading(false)
      }
      return
    }

    const vinculos = user.empresas.map((empresa) => ({
      id: empresa.id,
      nome: empresa.nome,
      razaoSocial: null,
      cnpj: empresa.cnpj,
      corPrimaria: null,
      logoUrl: null,
      createdAt: '',
    }))

    setEmpresas(vinculos)
    setEmpresaAtivaIdState(vinculos[0]?.id ?? null)
    clearEmpresaAtivaId()
  }, [isSuperAdmin, user])

  useEffect(() => {
    void refreshEmpresas()
  }, [refreshEmpresas])

  const setEmpresaAtiva = useCallback(
    (empresaId: string) => {
      if (!isSuperAdmin) {
        return
      }

      setEmpresaAtivaId(empresaId)
      setEmpresaAtivaIdState(empresaId)
    },
    [isSuperAdmin],
  )

  const empresaAtiva = useMemo(
    () => empresas.find((empresa) => empresa.id === empresaAtivaId) ?? null,
    [empresaAtivaId, empresas],
  )

  const value = useMemo<EmpresaContextValue>(
    () => ({
      empresas,
      empresaAtiva,
      empresaAtivaId,
      isLoading,
      isSuperAdmin,
      setEmpresaAtiva,
      refreshEmpresas,
    }),
    [
      empresas,
      empresaAtiva,
      empresaAtivaId,
      isLoading,
      isSuperAdmin,
      setEmpresaAtiva,
      refreshEmpresas,
    ],
  )

  return (
    <EmpresaContext.Provider value={value}>{children}</EmpresaContext.Provider>
  )
}

export function useEmpresa(): EmpresaContextValue {
  const context = useContext(EmpresaContext)

  if (!context) {
    throw new Error('useEmpresa deve ser usado dentro de EmpresaProvider')
  }

  return context
}
