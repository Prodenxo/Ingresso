'use client'

import { Button, Card, Chip } from '@heroui/react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { EventoFlyerUpload } from '@/components/eventos/evento-flyer-upload'
import { EventoBannerUpload } from '@/components/eventos/evento-banner-upload'
import { EventoLotesManager } from '@/components/eventos/evento-lotes-manager'
import { EventoLinksIndicacaoPanel } from '@/components/eventos/evento-links-indicacao-panel'
import { EventoCompartilharPanel } from '@/components/eventos/evento-compartilhar-panel'
import { EventoVitrineEditor } from '@/components/eventos/evento-vitrine-editor'
import { EventoCheckinConfig } from '@/components/eventos/evento-checkin-config'
import { CheckInRelatorioPanel } from '@/components/check-in/check-in-relatorio-panel'
import { AdminShell } from '@/components/layout/admin-shell'
import { ApiError, apiFetch } from '@/lib/api-client'
import { formatEventDate } from '@/lib/ingressos-utils'
import type { EventoDetalhe } from '@/types/eventos'

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    RASCUNHO: 'Rascunho',
    PUBLICADO: 'Publicado',
    CANCELADO: 'Cancelado',
    ENCERRADO: 'Encerrado',
  }

  return labels[status] ?? status
}

export default function EventoDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventoId = params.id

  const [evento, setEvento] = useState<EventoDetalhe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isUnpublishing, setIsUnpublishing] = useState(false)

  const loadEvento = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<EventoDetalhe>(`/eventos/${eventoId}`)
      setEvento(data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar evento')
    } finally {
      setIsLoading(false)
    }
  }, [eventoId])

  useEffect(() => {
    void loadEvento()
  }, [loadEvento])

  async function handlePublicar() {
    if (!evento) return

    setIsPublishing(true)
    setError(null)

    try {
      await apiFetch(`/eventos/${evento.id}/publicar`, { method: 'POST' })
      await loadEvento()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao publicar')
    } finally {
      setIsPublishing(false)
    }
  }

  async function handleDespublicar() {
    if (!evento) return

    if (
      !window.confirm(
        'Tirar este evento do ar? Ele deixa de aparecer na vitrine de ingressos e os links de indicação param de funcionar. Quem já comprou mantém o ingresso.',
      )
    ) {
      return
    }

    setIsUnpublishing(true)
    setError(null)

    try {
      await apiFetch(`/eventos/${evento.id}/despublicar`, { method: 'POST' })
      await loadEvento()
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Erro ao tirar evento do ar',
      )
    } finally {
      setIsUnpublishing(false)
    }
  }

  async function handleDeleteEvento() {
    if (!evento) return

    if (!window.confirm('Excluir este evento? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      await apiFetch(`/eventos/${evento.id}`, { method: 'DELETE' })
      router.push('/eventos')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir evento')
    }
  }

  if (isLoading) {
    return (
      <AdminShell title="Evento" subtitle="Carregando...">
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-zinc-400">Carregando evento...</p>
        </Card>
      </AdminShell>
    )
  }

  if (!evento) {
    return (
      <AdminShell title="Evento" subtitle="Não encontrado">
        <Card className="glass-panel rounded-2xl border-white/10 p-6">
          <p className="text-sm text-red-300">{error ?? 'Evento não encontrado'}</p>
          <Button
            variant="ghost"
            className="mt-4"
            onPress={() => router.push('/eventos')}
          >
            Voltar
          </Button>
        </Card>
      </AdminShell>
    )
  }

  const canPublish =
    evento.status === 'RASCUNHO' && evento.lotes.length > 0

  return (
    <AdminShell title={evento.nome} subtitle={formatEventDate(evento.dataInicio)}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Chip
          size="sm"
          variant="soft"
          color={evento.status === 'PUBLICADO' ? 'success' : 'accent'}
        >
          {statusLabel(evento.status)}
        </Chip>
        {canPublish ? (
          <Button
            variant="primary"
            size="sm"
            isDisabled={isPublishing}
            onPress={() => void handlePublicar()}
          >
            {isPublishing ? 'Publicando...' : 'Publicar evento'}
          </Button>
        ) : null}
        {evento.status === 'PUBLICADO' ? (
          <Button
            variant="ghost"
            size="sm"
            isDisabled={isUnpublishing}
            onPress={() => void handleDespublicar()}
          >
            {isUnpublishing ? 'Tirando do ar...' : 'Tirar do ar'}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" onPress={() => router.push('/eventos')}>
          Voltar
        </Button>
        {evento.status === 'RASCUNHO' ? (
          <Button variant="danger" size="sm" onPress={() => void handleDeleteEvento()}>
            Excluir
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <EventoCompartilharPanel
        eventoId={evento.id}
        eventoNome={evento.nome}
        publicado={evento.status === 'PUBLICADO'}
      />

      <div className="mb-6">
        <EventoVitrineEditor
          evento={evento}
          onUpdated={(atualizado) => setEvento(atualizado)}
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <EventoFlyerUpload
          eventoId={evento.id}
          eventoNome={evento.nome}
          imagemUrl={evento.imagemUrl}
          onRefresh={loadEvento}
          onUpdated={(imagemUrl) =>
            setEvento((current) =>
              current ? { ...current, imagemUrl } : current,
            )
          }
        />
        <EventoBannerUpload
          eventoId={evento.id}
          eventoNome={evento.nome}
          bannerUrl={evento.bannerUrl}
          onRefresh={loadEvento}
          onUpdated={(bannerUrl) =>
            setEvento((current) =>
              current ? { ...current, bannerUrl } : current,
            )
          }
        />
      </div>

      <div className="mb-6">
        <EventoLotesManager
          evento={evento}
          onUpdated={loadEvento}
          onError={setError}
        />
      </div>

      <div className="mb-6">
        <EventoLinksIndicacaoPanel
          eventoId={evento.id}
          eventoNome={evento.nome}
          lotes={evento.lotes}
        />
      </div>

      <div className="mt-6">
        <EventoCheckinConfig
          evento={evento}
          onUpdated={(atualizado) => setEvento(atualizado)}
        />
      </div>

      {evento.modoCheckin === 'BATE_PONTO' ? (
        <div className="mt-6">
          <CheckInRelatorioPanel eventoId={evento.id} />
        </div>
      ) : null}
    </AdminShell>
  )
}
