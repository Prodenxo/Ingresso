'use client'

import { Card, Chip } from '@heroui/react'
import { CircleDollarSign, Receipt, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AdminShell } from '@/components/layout/admin-shell'
import { apiFetch } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import type { FinanceiroResumo } from '@/types/dashboard'

function pedidoStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    CANCELADO: 'Cancelado',
    EXPIRADO: 'Expirado',
    ESTORNADO: 'Estornado',
  }

  return labels[status] ?? status
}

function pedidoStatusColor(
  status: string,
): 'success' | 'warning' | 'danger' | 'accent' {
  if (status === 'PAGO') return 'success'
  if (status === 'PENDENTE') return 'warning'
  if (status === 'CANCELADO' || status === 'EXPIRADO') return 'danger'
  return 'accent'
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function FinanceiroPage() {
  const [data, setData] = useState<FinanceiroResumo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void apiFetch<FinanceiroResumo>('/dashboard/financeiro')
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <AdminShell
      title="Financeiro"
      subtitle="Receita, ticket médio e histórico de pedidos"
    >
      {isLoading ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando...</p>
        </Card>
      ) : !data ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-red-300">
            Não foi possível carregar os dados financeiros.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass-panel rounded-2xl border-white/10 p-0">
              <Card.Header className="flex flex-row items-start justify-between px-5 pt-5">
                <div>
                  <Card.Description className="text-zinc-400">
                    Receita confirmada
                  </Card.Description>
                  <Card.Title className="mt-1 text-2xl text-white">
                    {formatCurrency(data.receita)}
                  </Card.Title>
                </div>
                <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
                  <CircleDollarSign className="size-4" aria-hidden />
                </div>
              </Card.Header>
              <Card.Content className="px-5 pb-5 text-sm text-zinc-400">
                {data.pedidosPagos} pedido(s) pago(s)
              </Card.Content>
            </Card>

            <Card className="glass-panel rounded-2xl border-white/10 p-0">
              <Card.Header className="flex flex-row items-start justify-between px-5 pt-5">
                <div>
                  <Card.Description className="text-zinc-400">
                    Ticket médio
                  </Card.Description>
                  <Card.Title className="mt-1 text-2xl text-white">
                    {formatCurrency(data.ticketMedio)}
                  </Card.Title>
                </div>
                <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300">
                  <TrendingUp className="size-4" aria-hidden />
                </div>
              </Card.Header>
              <Card.Content className="px-5 pb-5 text-sm text-zinc-400">
                Por pedido confirmado
              </Card.Content>
            </Card>

            <Card className="glass-panel rounded-2xl border-white/10 p-0">
              <Card.Header className="flex flex-row items-start justify-between px-5 pt-5">
                <div>
                  <Card.Description className="text-zinc-400">
                    Aguardando pagamento
                  </Card.Description>
                  <Card.Title className="mt-1 text-2xl text-white">
                    {data.pedidosPendentes}
                  </Card.Title>
                </div>
                <div className="rounded-xl bg-amber-500/15 p-2 text-amber-300">
                  <Receipt className="size-4" aria-hidden />
                </div>
              </Card.Header>
              <Card.Content className="px-5 pb-5 text-sm text-zinc-400">
                Pedidos com PIX não confirmado
              </Card.Content>
            </Card>
          </div>

          <Card className="glass-panel mt-6 rounded-2xl border-white/10 p-0">
            <Card.Header className="px-5 pt-5">
              <Card.Title className="text-white">Extrato de pedidos</Card.Title>
              <Card.Description>
                Histórico completo com comprador, evento e status
              </Card.Description>
            </Card.Header>
            <Card.Content className="px-5 pb-5">
              {data.pedidos.length === 0 ? (
                <p className="rounded-xl border border-white/8 bg-white/3 px-4 py-6 text-center text-sm text-zinc-400">
                  Nenhum pedido registrado ainda.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500">
                        <th className="pb-3 pr-4 font-medium">Pedido</th>
                        <th className="pb-3 pr-4 font-medium">Evento</th>
                        <th className="pb-3 pr-4 font-medium">Comprador</th>
                        <th className="pb-3 pr-4 font-medium">Valor</th>
                        <th className="pb-3 pr-4 font-medium">Ingressos</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 font-medium">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pedidos.map((pedido) => (
                        <tr
                          key={pedido.id}
                          className="border-b border-white/5 text-zinc-300"
                        >
                          <td className="py-3 pr-4 font-mono text-xs text-zinc-400">
                            {pedido.codigo}
                          </td>
                          <td className="py-3 pr-4">{pedido.eventoNome}</td>
                          <td className="py-3 pr-4">
                            <span className="block">{pedido.compradorNome}</span>
                            {pedido.compradorEmail ? (
                              <span className="text-xs text-zinc-500">
                                {pedido.compradorEmail}
                              </span>
                            ) : null}
                          </td>
                          <td className="py-3 pr-4 font-medium text-white">
                            {formatCurrency(pedido.total)}
                          </td>
                          <td className="py-3 pr-4">{pedido.ingressos ?? 0}</td>
                          <td className="py-3 pr-4">
                            <Chip
                              size="sm"
                              variant="soft"
                              color={pedidoStatusColor(pedido.status)}
                            >
                              {pedidoStatusLabel(pedido.status)}
                            </Chip>
                          </td>
                          <td className="py-3 text-zinc-500">
                            {formatDateTime(pedido.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Content>
          </Card>
        </>
      )}
    </AdminShell>
  )
}
