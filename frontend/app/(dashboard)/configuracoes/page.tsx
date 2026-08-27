'use client'

import { Card } from '@heroui/react'
import { ShieldAlert } from 'lucide-react'
import { GatewayPagamentosForm } from '@/components/configuracoes/gateway-pagamentos-form'
import { AdminShell } from '@/components/layout/admin-shell'
import { useAuth } from '@/components/auth/auth-provider'
import { canConfigurarPagamentos } from '@/lib/auth-roles'

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const podeConfigurar = canConfigurarPagamentos(user)

  return (
    <AdminShell
      title="Configurações"
      subtitle="Pagamentos e integrações da sua empresa"
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        {podeConfigurar ? (
          <GatewayPagamentosForm />
        ) : (
          <Card className="glass-panel rounded-2xl border-white/10 p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="size-5 shrink-0 text-amber-400" aria-hidden />
              <div>
                <h2 className="font-medium text-white">Sem permissão</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Apenas administradores e financeiro podem alterar estas
                  configurações.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </AdminShell>
  )
}
