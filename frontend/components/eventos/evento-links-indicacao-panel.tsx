'use client'

import { Button, Card, Chip } from '@heroui/react'
import { ChevronDown, ChevronUp, Copy, Link2, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormField } from '@/components/ui/form-field'
import { ApiError, apiFetch } from '@/lib/api-client'
import {
  buildLinkIndicacaoUrl,
  calcPrecoComDescontoIndicacao,
} from '@/lib/link-indicacao-storage'
import { formatEventDate } from '@/lib/ingressos-utils'
import { formatDescontoPercentual, parsePercentual } from '@/lib/preco-promocional'
import { formatCurrency } from '@/lib/utils'
import type { LoteAdmin } from '@/types/eventos'
import type {
  LinkIndicacao,
  LinkIndicacaoRelatorioItem,
} from '@/types/links-indicacao'

interface EventoLinksIndicacaoPanelProps {
  eventoId: string
  eventoNome: string
  lotes: LoteAdmin[]
}

function statusPedidoLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDENTE: 'Pendente',
    PAGO: 'Pago',
    CANCELADO: 'Cancelado',
    EXPIRADO: 'Expirado',
    ESTORNADO: 'Estornado',
  }

  return labels[status] ?? status
}

export function EventoLinksIndicacaoPanel({
  eventoId,
  eventoNome,
  lotes,
}: EventoLinksIndicacaoPanelProps) {
  const lotesAtivos = useMemo(
    () => lotes.filter((lote) => lote.status === 'ATIVO'),
    [lotes],
  )

  const [links, setLinks] = useState<LinkIndicacao[]>([])
  const [relatorio, setRelatorio] = useState<LinkIndicacaoRelatorioItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const [expandedLinkId, setExpandedLinkId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    slug: '',
    loteId: '',
    descontoPercentual: '0',
  })

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  useEffect(() => {
    if (lotesAtivos.length === 1 && !form.loteId) {
      setForm((current) => ({ ...current, loteId: lotesAtivos[0].id }))
    }
  }, [form.loteId, lotesAtivos])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [linksData, relatorioData] = await Promise.all([
        apiFetch<LinkIndicacao[]>(`/links-indicacao/evento/${eventoId}`),
        apiFetch<LinkIndicacaoRelatorioItem[]>(
          `/links-indicacao/evento/${eventoId}/relatorio`,
        ),
      ])

      setLinks(linksData)
      setRelatorio(relatorioData)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Erro ao carregar links de indicação',
      )
    } finally {
      setIsLoading(false)
    }
  }, [eventoId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const loteSelecionado = lotesAtivos.find((lote) => lote.id === form.loteId)
  const descontoPreview = Number(form.descontoPercentual.replace(',', '.')) || 0
  const precoComDescontoPreview = loteSelecionado
    ? calcPrecoComDescontoIndicacao(loteSelecionado.preco, descontoPreview)
    : null

  function getRelatorioItem(linkId: string) {
    return relatorio.find((item) => item.link.id === linkId)
  }

  async function handleCopy(text: string, label: string) {
    await navigator.clipboard.writeText(text)
    setSuccess(`${label} copiado`)
    setTimeout(() => setSuccess(null), 2000)
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    setError(null)

    try {
      await apiFetch(`/links-indicacao/evento/${eventoId}`, {
        method: 'POST',
        body: JSON.stringify({
          nome: form.nome.trim(),
          slug: form.slug.trim(),
          loteId: form.loteId,
          descontoPercentual: descontoPreview,
        }),
      })

      setForm({
        nome: '',
        slug: '',
        loteId: lotesAtivos[0]?.id ?? '',
        descontoPercentual: '0',
      })
      setShowForm(false)
      setSuccess('Link de indicação criado')
      await loadData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar link')
    } finally {
      setIsCreating(false)
    }
  }

  async function handleToggleAtivo(link: LinkIndicacao) {
    setError(null)

    try {
      await apiFetch(`/links-indicacao/${link.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ativo: !link.ativo }),
      })
      await loadData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar link')
    }
  }

  async function handleRemove(link: LinkIndicacao) {
    if (
      !window.confirm(
        `Excluir o link "${link.nome}"? Só é possível se ninguém comprou por ele.`,
      )
    ) {
      return
    }

    setError(null)

    try {
      await apiFetch(`/links-indicacao/${link.id}`, { method: 'DELETE' })
      await loadData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir link')
    }
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-5">
      <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Card.Title className="text-white">Links de indicação</Card.Title>
          <Card.Description>
            Gere links com palavra-chave, tipo de ingresso e desconto para
            rastrear vendas de {eventoNome}.
          </Card.Description>
        </div>
        <Button
          variant={showForm ? 'ghost' : 'primary'}
          size="sm"
          isDisabled={lotesAtivos.length === 0}
          onPress={() => setShowForm((current) => !current)}
        >
          <Plus className="size-4" aria-hidden />
          {showForm ? 'Fechar' : 'Novo link'}
        </Button>
      </Card.Header>

      <Card.Content className="space-y-4">
        {lotesAtivos.length === 0 ? (
          <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Publique ao menos um lote ativo antes de criar links de indicação.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </p>
        ) : null}

        {showForm && lotesAtivos.length > 0 ? (
          <form
            className="form-stack rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4"
            onSubmit={handleCreate}
          >
            <div className="form-row-2">
              <FormField
                label="Nome do link (interno)"
                name="link-nome"
                value={form.nome}
                onChange={(e) => setForm((c) => ({ ...c, nome: e.target.value }))}
                placeholder="Ex.: Instagram da Ana"
                required
              />
              <FormField
                label="Palavra-chave na URL"
                name="link-slug"
                value={form.slug}
                onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
                placeholder="Ex.: inquebravel"
                required
              />
            </div>

            <div className="form-row-2">
              <div className="space-y-2">
                <label htmlFor="link-lote" className="text-sm text-zinc-300">
                  Tipo de ingresso
                </label>
                <select
                  id="link-lote"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white"
                  value={form.loteId}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, loteId: e.target.value }))
                  }
                  required
                >
                  <option value="" disabled>
                    Selecione o lote
                  </option>
                  {lotesAtivos.map((lote) => (
                    <option key={lote.id} value={lote.id}>
                      {lote.nome} ({formatCurrency(lote.preco)})
                    </option>
                  ))}
                </select>
              </div>

              <FormField
                label="Desconto (%)"
                name="link-desconto"
                type="number"
                min={0}
                max={99.99}
                step={0.1}
                value={form.descontoPercentual}
                onChange={(e) =>
                  setForm((c) => ({ ...c, descontoPercentual: e.target.value }))
                }
                placeholder="Ex.: 10"
                required
              />
            </div>

            {loteSelecionado && precoComDescontoPreview !== null ? (
              <p className="text-xs text-zinc-400">
                Preço com desconto:{' '}
                <span className="font-medium text-emerald-300">
                  {formatCurrency(precoComDescontoPreview)}
                </span>
                {descontoPreview > 0 ? (
                  <>
                    {' '}
                    (de {formatCurrency(loteSelecionado.preco)},{' '}
                    {formatDescontoPercentual(descontoPreview)}% off)
                  </>
                ) : (
                  ' (sem desconto)'
                )}
              </p>
            ) : null}

            <p className="text-xs text-zinc-500">
              O link ficará:{' '}
              {origin
                ? buildLinkIndicacaoUrl(origin, form.slug || 'palavra-chave')
                : '/r/palavra-chave'}
            </p>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" isDisabled={isCreating}>
                {isCreating ? 'Criando...' : 'Gerar link'}
              </Button>
            </div>
          </form>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-zinc-400">Carregando links...</p>
        ) : links.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/3 px-4 py-6 text-center text-sm text-zinc-400">
            Nenhum link criado. Gere um link para influencers, parceiros ou
            campanhas.
          </p>
        ) : (
          links.map((link) => {
            const item = getRelatorioItem(link.id)
            const url = origin ? buildLinkIndicacaoUrl(origin, link.slug) : ''
            const isExpanded = expandedLinkId === link.id
            const loteNome = link.lote?.nome ?? item?.link.loteNome
            const desconto = parsePercentual(
              link.descontoPercentual ?? item?.link.descontoPercentual,
            )
            const precoLote = link.lote?.preco
            const precoFinal =
              precoLote !== undefined && precoLote !== null
                ? calcPrecoComDescontoIndicacao(precoLote, desconto)
                : null

            return (
              <div
                key={link.id}
                className="rounded-xl border border-white/8 bg-white/3 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{link.nome}</p>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={link.ativo ? 'success' : 'warning'}
                      >
                        {link.ativo ? 'Ativo' : 'Inativo'}
                      </Chip>
                    </div>
                    <p className="mt-1 break-all font-mono text-sm text-indigo-300">
                      /r/{link.slug}
                    </p>
                    {loteNome ? (
                      <p className="mt-2 text-sm text-zinc-300">
                        Ingresso:{' '}
                        <span className="text-white">{loteNome}</span>
                        {precoFinal !== null && precoLote !== undefined ? (
                          <>
                            {' '}
                            ·{' '}
                            {desconto && desconto > 0 ? (
                              <>
                                <span className="text-zinc-500 line-through">
                                  {formatCurrency(precoLote)}
                                </span>{' '}
                                <span className="text-emerald-300">
                                  {formatCurrency(precoFinal)}
                                </span>{' '}
                                <span className="text-indigo-300">
                                  ({formatDescontoPercentual(desconto)}% off)
                                </span>
                              </>
                            ) : (
                              formatCurrency(precoLote)
                            )}
                          </>
                        ) : null}
                      </p>
                    ) : null}
                    {item ? (
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-400">
                        <span>{item.metricas.cliques} cliques</span>
                        <span>{item.metricas.pedidosPagos} vendas pagas</span>
                        <span>{formatCurrency(item.metricas.receita)}</span>
                        <span>{item.metricas.taxaConversao}% conversão</span>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {url ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onPress={() => void handleCopy(url, 'Link')}
                      >
                        <Copy className="size-3.5" aria-hidden />
                        Copiar
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => void handleToggleAtivo(link)}
                    >
                      {link.ativo ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() =>
                        setExpandedLinkId(isExpanded ? null : link.id)
                      }
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-3.5" aria-hidden />
                      ) : (
                        <ChevronDown className="size-3.5" aria-hidden />
                      )}
                      Relatório
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onPress={() => void handleRemove(link)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>

                {isExpanded && item ? (
                  <div className="mt-4 border-t border-white/8 pt-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Compras por este link
                    </p>
                    {item.pedidos.length === 0 ? (
                      <p className="text-sm text-zinc-500">
                        Nenhuma compra registrada ainda.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {item.pedidos.map((pedido) => (
                          <div
                            key={pedido.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-sm"
                          >
                            <div>
                              <p className="font-medium text-white">
                                {pedido.compradorNome}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {pedido.compradorEmail} · {pedido.codigo}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-emerald-400">
                                {formatCurrency(pedido.total)}
                              </p>
                              <p className="text-xs text-zinc-500">
                                {statusPedidoLabel(pedido.status)} ·{' '}
                                {formatEventDate(pedido.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )
          })
        )}

        {links.length > 0 ? (
          <p className="flex items-center gap-2 text-xs text-zinc-500">
            <Link2 className="size-3.5" aria-hidden />
            Compartilhe o link /r/palavra-chave. O desconto vale apenas para o
            ingresso vinculado.
          </p>
        ) : null}
      </Card.Content>
    </Card>
  )
}
