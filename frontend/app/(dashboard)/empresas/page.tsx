'use client'

import { Button, Card, Chip } from '@heroui/react'
import { Building2, CalendarDays, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AdminShell } from '@/components/layout/admin-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { useEmpresa } from '@/components/empresa/empresa-provider'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(
    new Date(value),
  )
}

export default function EmpresasPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { empresas, empresaAtivaId, isLoading, isSuperAdmin, setEmpresaAtiva } =
    useEmpresa()

  useEffect(() => {
    if (user && !isSuperAdmin) {
      router.replace('/dashboard')
    }
  }, [isSuperAdmin, router, user])

  function operarComo(empresaId: string) {
    setEmpresaAtiva(empresaId)
    router.push('/dashboard')
  }

  return (
    <AdminShell
      title="Empresas cadastradas"
      subtitle="Visualize e opere o painel de qualquer empresa como administrador"
    >
      {isLoading ? (
        <p className="text-sm text-zinc-400">Carregando empresas...</p>
      ) : empresas.length === 0 ? (
        <Card className="glass-panel border-white/10 p-6">
          <p className="text-sm text-zinc-400">Nenhuma empresa cadastrada no sistema.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {empresas.map((empresa) => {
            const isAtiva = empresa.id === empresaAtivaId

            return (
              <Card
                key={empresa.id}
                className="glass-panel border-white/10 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                      <Building2 className="size-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{empresa.nome}</h3>
                      {empresa.razaoSocial ? (
                        <p className="text-xs text-zinc-500">{empresa.razaoSocial}</p>
                      ) : null}
                    </div>
                  </div>
                  {isAtiva ? (
                    <Chip size="sm" color="warning" variant="soft">
                      Ativa
                    </Chip>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <CalendarDays className="size-4" />
                      Eventos
                    </div>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {empresa.totalEventos ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Users className="size-4" />
                      Membros
                    </div>
                    <p className="mt-1 text-lg font-semibold text-white">
                      {empresa.totalMembros ?? 0}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-zinc-500">
                  CNPJ: {empresa.cnpj}
                  {empresa.createdAt
                    ? ` · Cadastro ${formatDate(empresa.createdAt)}`
                    : ''}
                </p>

                <Button
                  className="mt-4 w-full"
                  variant={isAtiva ? 'secondary' : 'primary'}
                  onPress={() => operarComo(empresa.id)}
                >
                  {isAtiva ? 'Continuar operando' : 'Operar como admin'}
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </AdminShell>
  )
}
