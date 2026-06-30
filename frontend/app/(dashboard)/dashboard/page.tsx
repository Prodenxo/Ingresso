'use client'

import { Button, Card, Chip } from '@heroui/react'
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  Ticket,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AdminShell } from '@/components/layout/admin-shell'
import { apiFetch } from '@/lib/api-client'
import { formatCurrency } from '@/lib/utils'
import type { DashboardOverview } from '@/types/dashboard'

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

export default function DashboardPage() {
  const router = useRouter()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void apiFetch<DashboardOverview>('/dashboard/overview')
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setIsLoading(false))
  }, [])

  const cards = overview
    ? [
        {
          label: 'Eventos publicados',
          value: String(overview.eventosPublicados),
          hint: `${overview.eventosTotal} no total`,
          icon: CalendarDays,
        },
        {
          label: 'Ingressos vendidos',
          value: String(overview.ingressosVendidos),
          hint: `${overview.ingressosDisponiveis} disponíveis`,
          icon: Ticket,
        },
        {
          label: 'Ocupação',
          value: `${overview.taxaOcupacao}%`,
          hint: 'Capacidade utilizada',
          icon: TrendingUp,
        },
        {
          label: 'Pedidos pendentes',
          value: String(overview.pedidosPendentes),
          hint:
            overview.pedidosPendentes > 0
              ? 'Aguardando confirmação'
              : 'Nenhum pendente',
          icon: AlertCircle,
          alert: overview.pedidosPendentes > 0,
        },
      ]
    : []

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Visão operacional dos seus eventos e ingressos"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="glass-panel rounded-2xl border-white/10 p-5"
              >
                <p className="text-sm text-zinc-400">Carregando...</p>
              </Card>
            ))
          : cards.map(({ label, value, hint, icon: Icon, alert }) => (
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
                  <div
                    className={
                      alert
                        ? 'rounded-xl bg-amber-500/15 p-2 text-amber-300'
                        : 'rounded-xl bg-indigo-500/15 p-2 text-indigo-300'
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                  </div>
                </Card.Header>
                <Card.Content className="px-5 pb-5">
                  <p className="text-xs text-zinc-500">{hint}</p>
                </Card.Content>
              </Card>
            ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="glass-panel rounded-2xl border-white/10 lg:col-span-2">
          <Card.Header className="flex flex-row items-start justify-between gap-3 px-5 pt-5">
            <div>
              <Card.Title className="text-white">Atividade recente</Card.Title>
              <Card.Description>
                Últimos pedidos — detalhes financeiros em Financeiro
              </Card.Description>
            </div>
            <Link
              href="/financeiro"
              className="rounded-lg px-3 py-1.5 text-sm text-indigo-300 transition-colors hover:bg-white/5 hover:text-indigo-200"
            >
              Ver financeiro
            </Link>
          </Card.Header>
          <Card.Content className="space-y-2 px-5 pb-5">
            {isLoading ? (
              <p className="text-sm text-zinc-400">Carregando...</p>
            ) : !overview?.pedidosRecentes.length ? (
              <p className="rounded-xl border border-white/8 bg-white/3 px-4 py-6 text-center text-sm text-zinc-400">
                Nenhum pedido ainda. Publique um evento para começar a vender.
              </p>
            ) : (
              overview.pedidosRecentes.map((pedido) => (
                <div
                  key={pedido.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{pedido.eventoNome}</p>
                    <p className="text-sm text-zinc-400">
                      {pedido.compradorNome} · {formatCurrency(pedido.total)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDateTime(pedido.createdAt)}
                    </p>
                  </div>
                  <Chip
                    size="sm"
                    variant="soft"
                    color={pedidoStatusColor(pedido.status)}
                  >
                    {pedidoStatusLabel(pedido.status)}
                  </Chip>
                </div>
              ))
            )}
          </Card.Content>
        </Card>

        <Card className="glass-panel rounded-2xl border-white/10">
          <Card.Header className="px-5 pt-5">
            <Card.Title className="text-white">Ações rápidas</Card.Title>
            <Card.Description>
              Operacional — receita e extrato em Financeiro
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3 px-5 pb-5">
            <Button
              variant="primary"
              className="w-full"
              onPress={() => router.push('/eventos/novo')}
            >
              {overview && overview.eventosPublicados > 0
                ? 'Novo evento'
                : 'Criar primeiro evento'}
              <ArrowUpRight className="size-4" aria-hidden />
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onPress={() => router.push('/eventos')}
            >
              Gerenciar eventos
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onPress={() => router.push('/financeiro')}
            >
              Ver receita e pedidos
            </Button>
          </Card.Content>
        </Card>
      </div>
    </AdminShell>
  )
}
