'use client'

import { Button, Card, Chip } from '@heroui/react'
import { CalendarDays, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { EventoPoster } from '@/components/ingressos/evento-poster'
import { AdminShell } from '@/components/layout/admin-shell'
import { apiFetch } from '@/lib/api-client'
import { formatEventDate } from '@/lib/ingressos-utils'
import type { EventoAdmin } from '@/types/eventos'

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    PUBLICADO: 'Publicado',
    CANCELADO: 'Cancelado',
    ENCERRADO: 'Encerrado',
  }

  return labels[status] ?? status
}

export default function EventosAdminPage() {
  const router = useRouter()
  const [eventos, setEventos] = useState<EventoAdmin[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    void apiFetch<EventoAdmin[]>('/eventos/admin')
      .then(setEventos)
      .catch(() => setEventos([]))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <AdminShell title="Eventos" subtitle="Gerencie seus eventos e lotes">
      <div className="mb-6 flex justify-end">
        <Button variant="primary" onPress={() => router.push('/eventos/novo')}>
          <Plus className="size-4" aria-hidden />
          Novo evento
        </Button>
      </div>

      {isLoading ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando eventos...</p>
        </Card>
      ) : eventos.length === 0 ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-8 text-center">
          <h3 className="text-lg font-medium text-white">Nenhum evento criado</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Crie seu primeiro evento para começar a vender ingressos.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {eventos.map((evento) => (
            <Card
              key={evento.id}
              className="glass-panel rounded-2xl border-white/10 p-0"
            >
              <div className="flex items-center gap-4 p-4">
                <EventoPoster
                  imagemUrl={evento.imagemUrl}
                  bannerUrl={evento.bannerUrl}
                  nome={evento.nome}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-white">
                        {evento.nome}
                      </h3>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-400">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {formatEventDate(evento.dataInicio)}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {evento._count.lotes} lote(s) · {evento._count.pedidos}{' '}
                        pedido(s)
                      </p>
                    </div>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={evento.status === 'PUBLICADO' ? 'success' : 'accent'}
                    >
                      {statusLabel(evento.status)}
                    </Chip>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onPress={() => router.push(`/eventos/${evento.id}`)}
                >
                  Gerenciar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
