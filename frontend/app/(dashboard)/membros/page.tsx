'use client'

import { Card } from '@heroui/react'
import { ShieldAlert } from 'lucide-react'
import { AdminShell } from '@/components/layout/admin-shell'
import { ConviteMembrosPanel } from '@/components/membros/convite-membros-panel'
import { MembrosVinculadosPanel } from '@/components/membros/membros-vinculados-panel'
import { useAuth } from '@/components/auth/auth-provider'
import { canGerenciarConviteMembros } from '@/lib/auth-roles'

export default function MembrosPage() {
  const { user } = useAuth()
  const podeGerenciar = canGerenciarConviteMembros(user)

  return (
    <AdminShell
      title="Membros"
      subtitle="Convites, vínculos e acesso exclusivo à sua empresa"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {podeGerenciar ? (
          <>
            <ConviteMembrosPanel />
            <MembrosVinculadosPanel />
          </>
        ) : (
          <Card className="glass-panel rounded-2xl border-white/10 p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <h2 className="font-medium text-white">Sem permissão</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Apenas administradores podem gerenciar convites e membros
                  vinculados.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
