'use client'

import { Button, Card, Chip } from '@heroui/react'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { EventoFlyerUpload } from '@/components/eventos/evento-flyer-upload'
import { EventoCheckinConfig } from '@/components/eventos/evento-checkin-config'
import { CheckInRelatorioPanel } from '@/components/check-in/check-in-relatorio-panel'
import { LotePrecoPromo } from '@/components/ingressos/lote-preco-promo'
import { AdminShell } from '@/components/layout/admin-shell'
import { FormField } from '@/components/ui/form-field'
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
  const [isAddingLote, setIsAddingLote] = useState(false)
  const [loteForm, setLoteForm] = useState({
    nome: '',
    preco: '',
    precoDe: '',
    quantidade: '100',
    vendaInicio: '',
    vendaFim: '',
    limitePorCompra: '5',
  })

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

  async function handleAddLote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!evento) return

    setIsAddingLote(true)
    setError(null)

    try {
      await apiFetch(`/eventos/${evento.id}/lotes`, {
        method: 'POST',
        body: JSON.stringify({
          nome: loteForm.nome,
          preco: Number(loteForm.preco),
          precoDe: loteForm.precoDe ? Number(loteForm.precoDe) : undefined,
          quantidade: Number(loteForm.quantidade),
          vendaInicio: new Date(loteForm.vendaInicio).toISOString(),
          vendaFim: new Date(loteForm.vendaFim).toISOString(),
          limitePorCompra: Number(loteForm.limitePorCompra),
        }),
      })

      setLoteForm({
        nome: '',
        preco: '',
        precoDe: '',
        quantidade: '100',
        vendaInicio: '',
        vendaFim: '',
        limitePorCompra: '5',
      })
      await loadEvento()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar lote')
    } finally {
      setIsAddingLote(false)
    }
  }

  async function handleRemoveLote(loteId: string) {
    if (!evento) return

    setError(null)

    try {
      await apiFetch(`/eventos/${evento.id}/lotes/${loteId}`, {
        method: 'DELETE',
      })
      await loadEvento()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover lote')
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

      <div className="mb-6">
        <EventoFlyerUpload
          eventoId={evento.id}
          eventoNome={evento.nome}
          imagemUrl={evento.imagemUrl}
          onUpdated={(imagemUrl) =>
            setEvento((current) =>
              current ? { ...current, imagemUrl, bannerUrl: imagemUrl } : current,
            )
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel rounded-2xl border-white/10 p-5">
          <Card.Header>
            <Card.Title className="text-white">Lotes</Card.Title>
            <Card.Description>
              {evento.lotes.length} lote(s) cadastrado(s)
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3">
            {evento.lotes.length === 0 ? (
              <p className="text-sm text-zinc-400">
                Adicione pelo menos um lote antes de publicar.
              </p>
            ) : (
              evento.lotes.map((lote) => (
                <div
                  key={lote.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-white">{lote.nome}</p>
                    <div className="mt-1">
                      <LotePrecoPromo
                        preco={lote.preco}
                        precoDe={lote.precoDe}
                        size="sm"
                      />
                    </div>
                    <p className="mt-1 text-sm text-zinc-400">
                      {lote.disponiveis} disponíveis · vendidos{' '}
                      {lote.quantidadeVendida}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Vendas: {formatEventDate(lote.vendaInicio)} até{' '}
                      {formatEventDate(lote.vendaFim)}
                    </p>
                  </div>
                  {evento.status === 'RASCUNHO' && lote.quantidadeVendida === 0 ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onPress={() => void handleRemoveLote(lote.id)}
                    >
                      Remover
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </Card.Content>
        </Card>

        {evento.status === 'RASCUNHO' ? (
          <Card className="glass-panel rounded-2xl border-white/10 p-5">
            <Card.Header>
              <Card.Title className="text-white">Novo lote</Card.Title>
            </Card.Header>
            <Card.Content>
              <form className="form-stack" onSubmit={handleAddLote}>
                <FormField
                  label="Nome do lote"
                  name="lote-nome"
                  value={loteForm.nome}
                  onChange={(e) =>
                    setLoteForm((c) => ({ ...c, nome: e.target.value }))
                  }
                  placeholder="Ex.: Pista, VIP, Camarote"
                  required
                />
                <div className="form-row-2">
                  <FormField
                    label="Valor unitário (R$)"
                    name="lote-preco"
                    type="number"
                    min="0"
                    step="0.01"
                    value={loteForm.preco}
                    onChange={(e) =>
                      setLoteForm((c) => ({ ...c, preco: e.target.value }))
                    }
                    placeholder="300,00"
                    required
                  />
                  <FormField
                    label="Preço âncora — De (R$)"
                    name="lote-preco-de"
                    type="number"
                    min="0"
                    step="0.01"
                    value={loteForm.precoDe}
                    onChange={(e) =>
                      setLoteForm((c) => ({ ...c, precoDe: e.target.value }))
                    }
                    placeholder="1597,00 (opcional)"
                  />
                </div>
                <p className="text-xs text-zinc-500">
                  O preço âncora aparece riscado na vitrine (ex.: De R$ 1.597,00
                  por R$ 300,00). O cliente paga só o valor unitário.
                </p>

                {loteForm.preco &&
                loteForm.precoDe &&
                Number(loteForm.precoDe) > Number(loteForm.preco) ? (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/80">
                      Prévia na vitrine (cliente)
                    </p>
                    <div className="mt-1">
                      <LotePrecoPromo
                        preco={Number(loteForm.preco)}
                        precoDe={Number(loteForm.precoDe)}
                        showLabel
                      />
                    </div>
                  </div>
                ) : null}

                <div className="form-row-2">
                  <FormField
                    label="Quantidade"
                    name="lote-qtd"
                    type="number"
                    min="1"
                    value={loteForm.quantidade}
                    onChange={(e) =>
                      setLoteForm((c) => ({ ...c, quantidade: e.target.value }))
                    }
                    required
                  />
                  <FormField
                    label="Limite por compra"
                    name="limite"
                    type="number"
                    min="1"
                    value={loteForm.limitePorCompra}
                    onChange={(e) =>
                      setLoteForm((c) => ({
                        ...c,
                        limitePorCompra: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-row-2">
                  <FormField
                    label="Início das vendas"
                    name="venda-inicio"
                    type="datetime-local"
                    value={loteForm.vendaInicio}
                    onChange={(e) =>
                      setLoteForm((c) => ({ ...c, vendaInicio: e.target.value }))
                    }
                    required
                  />
                  <FormField
                    label="Fim das vendas"
                    name="venda-fim"
                    type="datetime-local"
                    value={loteForm.vendaFim}
                    onChange={(e) =>
                      setLoteForm((c) => ({ ...c, vendaFim: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button type="submit" variant="primary" isDisabled={isAddingLote}>
                    {isAddingLote ? 'Salvando...' : 'Adicionar lote'}
                  </Button>
                </div>
              </form>
            </Card.Content>
          </Card>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <EventoCheckinConfig
          evento={evento}
          onUpdated={(atualizado) => setEvento(atualizado)}
        />
        {evento.modoCheckin === 'BATE_PONTO' ? (
          <CheckInRelatorioPanel eventoId={evento.id} />
        ) : null}
      </div>
    </AdminShell>
  )
}
