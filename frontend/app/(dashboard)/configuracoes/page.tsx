'use client'

import { Card } from '@heroui/react'
import { ShieldAlert } from 'lucide-react'
import { GatewayInterPagamentosForm } from '@/components/configuracoes/gateway-inter-pagamentos-form'
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
      {podeConfigurar ? (
        <GatewayInterPagamentosForm />
      ) : (
        <Card className="glass-panel mx-auto max-w-2xl rounded-2xl border-white/10 p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="size-5 shrink-0 text-amber-400" aria-hidden />
            <div>
              <h2 className="font-medium text-white">Sem permissão</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Apenas administradores e financeiro podem configurar pagamentos.
              </p>
            </div>
          </div>
        </Card>
      )}
    </AdminShell>
  )
}
