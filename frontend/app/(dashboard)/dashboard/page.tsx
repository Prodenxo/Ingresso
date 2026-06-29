'use client'

import { Button, Card, Chip } from '@heroui/react'
import {
  ArrowUpRight,
  CircleDollarSign,
  Ticket,
  TrendingUp,
  Users,
} from 'lucide-react'
import { AdminShell } from '@/components/layout/admin-shell'
import { formatCurrency } from '@/lib/utils'

const stats = [
  {
    label: 'Receita',
    value: formatCurrency(0),
    hint: 'Aguardando primeiras vendas',
    icon: CircleDollarSign,
    trend: '+0%',
  },
  {
    label: 'Pedidos',
    value: '0',
    hint: 'Nenhum pedido ainda',
    icon: Users,
    trend: '+0%',
  },
  {
    label: 'Ingressos vendidos',
    value: '0',
    hint: '0 disponíveis',
    icon: Ticket,
    trend: '+0%',
  },
  {
    label: 'Conversão',
    value: '0%',
    hint: 'Checkout ainda não ativo',
    icon: TrendingUp,
    trend: '—',
  },
]

export default function DashboardPage() {
  return (
    <AdminShell
      title="Dashboard"
      subtitle="Visão geral das suas vendas e eventos"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, hint, icon: Icon, trend }) => (
          <Card
            key={label}
            className="glass-panel rounded-2xl border-white/10 p-0"
          >
            <Card.Header className="flex flex-row items-start justify-between gap-3 px-5 pt-5">
              <div>
                <Card.Description className="text-zinc-400">
                  {label}
                </Card.Description>
                <Card.Title className="mt-1 text-2xl text-white">
                  {value}
                </Card.Title>
              </div>
              <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300">
                <Icon className="size-4" aria-hidden />
              </div>
            </Card.Header>
            <Card.Content className="flex items-center justify-between px-5 pb-5">
              <p className="text-xs text-zinc-500">{hint}</p>
              <Chip size="sm" variant="soft" color="success">
                {trend}
              </Chip>
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel rounded-2xl border-white/10 lg:col-span-2">
          <Card.Header className="px-5 pt-5">
            <Card.Title className="text-white">Próximos passos</Card.Title>
            <Card.Description>
              Base do projeto criada. Continue com autenticação e eventos.
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3 px-5 pb-5">
            {[
              'Rodar npm run dev na raiz do projeto',
              'Implementar login e cadastro de empresas',
              'Criar primeiro evento com lotes',
              'Conectar pagamentos PIX e cartão',
            ].map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3 text-sm text-zinc-300"
              >
                <span className="flex size-7 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-zinc-200">
                  {index + 1}
                </span>
                {step}
              </div>
            ))}
          </Card.Content>
        </Card>

        <Card className="glass-panel rounded-2xl border-white/10">
          <Card.Header className="px-5 pt-5">
            <Card.Title className="text-white">Status da API</Card.Title>
            <Card.Description>
              Backend NestJS na porta 3001
            </Card.Description>
          </Card.Header>
          <Card.Content className="px-5 pb-5">
            <p className="mb-4 text-sm leading-relaxed text-zinc-400">
              Health check em{' '}
              <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-indigo-300">
                /api/health
              </code>
            </p>
            <Button variant="primary" className="w-full">
              Criar primeiro evento
              <ArrowUpRight className="size-4" aria-hidden />
            </Button>
          </Card.Content>
        </Card>
      </div>
    </AdminShell>
  )
}
