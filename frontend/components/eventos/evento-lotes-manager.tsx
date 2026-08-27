'use client'

import { Button, Card, Chip } from '@heroui/react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { LotePrecoPromo } from '@/components/ingressos/lote-preco-promo'
import { FormField } from '@/components/ui/form-field'
import { ApiError, apiFetch } from '@/lib/api-client'
import { formatEventDate } from '@/lib/ingressos-utils'
import {
  calcDescontoPercentual,
  calcPrecoDeFromDesconto,
  formatDescontoPercentual,
} from '@/lib/preco-promocional'
import type { EventoDetalhe, LoteAdmin } from '@/types/eventos'

interface LoteFormState {
  nome: string
  preco: string
  precoDe: string
  descontoPercentual: string
  quantidade: string
  vendaInicio: string
  vendaFim: string
  limitePorCompra: string
  status: 'ATIVO' | 'INATIVO'
}

interface EventoLotesManagerProps {
  evento: EventoDetalhe
  onUpdated: () => Promise<void>
  onError: (message: string) => void
}

const EMPTY_LOTE_FORM: LoteFormState = {
  nome: '',
  preco: '',
  precoDe: '',
  descontoPercentual: '',
  quantidade: '100',
  vendaInicio: '',
  vendaFim: '',
  limitePorCompra: '5',
  status: 'ATIVO',
}

function toDatetimeLocal(iso: string): string {
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function loteFromAdmin(lote: LoteAdmin): LoteFormState {
  const desconto =
    lote.precoDe != null && lote.precoDe > lote.preco
      ? calcDescontoPercentual(lote.preco, lote.precoDe)
      : null

  return {
    nome: lote.nome,
    preco: String(lote.preco),
    precoDe: lote.precoDe != null ? String(lote.precoDe) : '',
    descontoPercentual:
      desconto != null ? formatDescontoPercentual(desconto) : '',
    quantidade: String(lote.quantidade),
    vendaInicio: toDatetimeLocal(lote.vendaInicio),
    vendaFim: toDatetimeLocal(lote.vendaFim),
    limitePorCompra: String(lote.limitePorCompra),
    status: lote.status === 'INATIVO' ? 'INATIVO' : 'ATIVO',
  }
}

function applyPrecoChange(form: LoteFormState, preco: string): LoteFormState {
  const next = { ...form, preco }
  const precoNum = Number(preco)
  const descontoNum = Number(form.descontoPercentual)

  if (
    form.descontoPercentual.trim() &&
    Number.isFinite(precoNum) &&
    Number.isFinite(descontoNum) &&
    descontoNum > 0 &&
    descontoNum < 100
  ) {
    const precoDe = calcPrecoDeFromDesconto(precoNum, descontoNum)
    next.precoDe = precoDe != null ? String(precoDe) : ''
    return next
  }

  const precoDeNum = Number(form.precoDe)
  if (
    form.precoDe.trim() &&
    Number.isFinite(precoNum) &&
    Number.isFinite(precoDeNum) &&
    precoDeNum > precoNum
  ) {
    const desconto = calcDescontoPercentual(precoNum, precoDeNum)
    next.descontoPercentual =
      desconto != null ? formatDescontoPercentual(desconto) : ''
  }

  return next
}

function applyDescontoChange(
  form: LoteFormState,
  descontoPercentual: string,
): LoteFormState {
  const next = { ...form, descontoPercentual }

  if (!descontoPercentual.trim()) {
    next.precoDe = ''
    return next
  }

  const precoNum = Number(form.preco)
  const descontoNum = Number(descontoPercentual)

  if (
    Number.isFinite(precoNum) &&
    Number.isFinite(descontoNum) &&
    descontoNum > 0 &&
    descontoNum < 100
  ) {
    const precoDe = calcPrecoDeFromDesconto(precoNum, descontoNum)
    next.precoDe = precoDe != null ? String(precoDe) : ''
  }

  return next
}

function applyPrecoDeChange(form: LoteFormState, precoDe: string): LoteFormState {
  const next = { ...form, precoDe, descontoPercentual: '' }

  if (!precoDe.trim()) {
    return next
  }

  const precoNum = Number(form.preco)
  const precoDeNum = Number(precoDe)

  if (
    Number.isFinite(precoNum) &&
    Number.isFinite(precoDeNum) &&
    precoDeNum > precoNum
  ) {
    const desconto = calcDescontoPercentual(precoNum, precoDeNum)
    next.descontoPercentual =
      desconto != null ? formatDescontoPercentual(desconto) : ''
  }

  return next
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    ATIVO: 'Ativo',
    INATIVO: 'Inativo',
    ESGOTADO: 'Esgotado',
  }

  return labels[status] ?? status
}

function statusColor(
  status: string,
): 'success' | 'warning' | 'danger' | 'default' {
  if (status === 'ATIVO') return 'success'
  if (status === 'INATIVO') return 'warning'
  if (status === 'ESGOTADO') return 'danger'
  return 'default'
}

function LoteFormFields({
  form,
  onChange,
  showStatus,
  priceLocked,
}: {
  form: LoteFormState
  onChange: (next: LoteFormState) => void
  showStatus?: boolean
  priceLocked?: boolean
}) {
  const hasPromoPreview =
    form.preco &&
    form.precoDe &&
    Number(form.precoDe) > Number(form.preco)

  const descontoPreview =
    hasPromoPreview &&
    calcDescontoPercentual(Number(form.preco), Number(form.precoDe))

  return (
    <>
      <FormField
        label="Nome do lote"
        name="lote-nome"
        value={form.nome}
        onChange={(e) => onChange({ ...form, nome: e.target.value })}
        placeholder="Ex.: 1º lote, Pista, VIP, Camarote"
        required
      />

      <FormField
        label="Valor unitário — Por (R$)"
        name="lote-preco"
        type="number"
        min="0"
        step="0.01"
        value={form.preco}
        onChange={(e) => onChange(applyPrecoChange(form, e.target.value))}
        placeholder="300,00"
        isDisabled={priceLocked}
        required
      />

      <div className="form-row-2">
        <FormField
          label="Desconto (%)"
          name="lote-desconto"
          type="number"
          min="1"
          max="99"
          step="1"
          value={form.descontoPercentual}
          onChange={(e) =>
            onChange(applyDescontoChange(form, e.target.value))
          }
          placeholder="70 (opcional)"
          isDisabled={priceLocked}
        />
        <FormField
          label="Preço âncora — De (R$)"
          name="lote-preco-de"
          type="number"
          min="0"
          step="0.01"
          value={form.precoDe}
          onChange={(e) => onChange(applyPrecoDeChange(form, e.target.value))}
          placeholder="1000,00 (opcional)"
          isDisabled={priceLocked}
        />
      </div>

      {priceLocked ? (
        <p className="text-xs text-amber-400/90">
          Preço bloqueado: este lote já possui vendas registradas.
        </p>
      ) : (
        <p className="text-xs text-zinc-500">
          Informe o desconto em % ou o preço âncora manualmente — os dois campos
          se atualizam juntos. Ex.: R$ 300 com 70% off → De R$ 1.000,00 por R$
          300,00 na vitrine.
        </p>
      )}

      {hasPromoPreview ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-400/80">
              Prévia na vitrine
            </p>
            {descontoPreview ? (
              <Chip size="sm" variant="soft" color="success">
                −{formatDescontoPercentual(descontoPreview)}%
              </Chip>
            ) : null}
          </div>
          <div className="mt-1">
            <LotePrecoPromo
              preco={Number(form.preco)}
              precoDe={Number(form.precoDe)}
              showLabel
            />
          </div>
        </div>
      ) : null}

      <div className="form-row-2">
        <FormField
          label="Quantidade total"
          name="lote-qtd"
          type="number"
          min="1"
          value={form.quantidade}
          onChange={(e) => onChange({ ...form, quantidade: e.target.value })}
          required
        />
        <FormField
          label="Limite por compra"
          name="limite"
          type="number"
          min="1"
          value={form.limitePorCompra}
          onChange={(e) =>
            onChange({ ...form, limitePorCompra: e.target.value })
          }
          required
        />
      </div>

      <div className="form-row-2">
        <FormField
          label="Início das vendas"
          name="venda-inicio"
          type="datetime-local"
          value={form.vendaInicio}
          onChange={(e) => onChange({ ...form, vendaInicio: e.target.value })}
          required
        />
        <FormField
          label="Fim das vendas"
          name="venda-fim"
          type="datetime-local"
          value={form.vendaFim}
          onChange={(e) => onChange({ ...form, vendaFim: e.target.value })}
          required
        />
      </div>

      {showStatus ? (
        <div>
          <label
            htmlFor="lote-status"
            className="mb-1.5 block text-sm text-zinc-300"
          >
            Status do lote
          </label>
          <select
            id="lote-status"
            value={form.status}
            onChange={(e) =>
              onChange({
                ...form,
                status: e.target.value as 'ATIVO' | 'INATIVO',
              })
            }
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none focus:border-indigo-400/50"
          >
            <option value="ATIVO">Ativo — visível na vitrine</option>
            <option value="INATIVO">Inativo — oculto na vitrine</option>
          </select>
        </div>
      ) : null}
    </>
  )
}

export function EventoLotesManager({
  evento,
  onUpdated,
  onError,
}: EventoLotesManagerProps) {
  const canManage =
    evento.status === 'RASCUNHO' || evento.status === 'PUBLICADO'

  const [createForm, setCreateForm] = useState<LoteFormState>(EMPTY_LOTE_FORM)
  const [editingLoteId, setEditingLoteId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<LoteFormState | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(evento.lotes.length === 0)

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    onError('')

    try {
      await apiFetch(`/eventos/${evento.id}/lotes`, {
        method: 'POST',
        body: JSON.stringify({
          nome: createForm.nome.trim(),
          preco: Number(createForm.preco),
          precoDe: createForm.precoDe ? Number(createForm.precoDe) : undefined,
          quantidade: Number(createForm.quantidade),
          vendaInicio: new Date(createForm.vendaInicio).toISOString(),
          vendaFim: new Date(createForm.vendaFim).toISOString(),
          limitePorCompra: Number(createForm.limitePorCompra),
        }),
      })

      setCreateForm(EMPTY_LOTE_FORM)
      setShowCreateForm(false)
      await onUpdated()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Erro ao criar lote')
    } finally {
      setIsCreating(false)
    }
  }

  function startEdit(lote: LoteAdmin) {
    setEditingLoteId(lote.id)
    setEditForm(loteFromAdmin(lote))
  }

  function cancelEdit() {
    setEditingLoteId(null)
    setEditForm(null)
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingLoteId || !editForm) return

    setIsSavingEdit(true)
    onError('')

    try {
      await apiFetch(`/eventos/${evento.id}/lotes/${editingLoteId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nome: editForm.nome.trim(),
          preco: Number(editForm.preco),
          precoDe: editForm.precoDe ? Number(editForm.precoDe) : null,
          quantidade: Number(editForm.quantidade),
          vendaInicio: new Date(editForm.vendaInicio).toISOString(),
          vendaFim: new Date(editForm.vendaFim).toISOString(),
          limitePorCompra: Number(editForm.limitePorCompra),
          status: editForm.status,
        }),
      })

      cancelEdit()
      await onUpdated()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Erro ao atualizar lote')
    } finally {
      setIsSavingEdit(false)
    }
  }

  async function handleRemove(lote: LoteAdmin) {
    if (
      !window.confirm(
        `Remover o lote "${lote.nome}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return
    }

    onError('')

    try {
      await apiFetch(`/eventos/${evento.id}/lotes/${lote.id}`, {
        method: 'DELETE',
      })
      if (editingLoteId === lote.id) cancelEdit()
      await onUpdated()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Erro ao remover lote')
    }
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-5">
      <Card.Header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Card.Title className="text-white">Ingressos e lotes</Card.Title>
          <Card.Description>
            Crie tipos de ingresso com preço cheio ou promocional. Cada lote pode
            ter quantidade e período de venda próprios.
          </Card.Description>
        </div>
        {canManage ? (
          <Button
            variant={showCreateForm ? 'ghost' : 'primary'}
            size="sm"
            onPress={() => setShowCreateForm((current) => !current)}
          >
            <Plus className="size-4" aria-hidden />
            {showCreateForm ? 'Fechar formulário' : 'Novo lote'}
          </Button>
        ) : null}
      </Card.Header>

      <Card.Content className="space-y-4">
        {evento.lotes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/3 px-4 py-6 text-center text-sm text-zinc-400">
            Nenhum lote cadastrado. Adicione pelo menos um ingresso antes de
            publicar o evento.
          </p>
        ) : (
          evento.lotes.map((lote) => {
            const isEditing = editingLoteId === lote.id
            const priceLocked = lote.quantidadeVendida > 0

            return (
              <div
                key={lote.id}
                className="rounded-xl border border-white/8 bg-white/3 p-4"
              >
                {isEditing && editForm ? (
                  <form className="form-stack" onSubmit={handleSaveEdit}>
                    <LoteFormFields
                      form={editForm}
                      onChange={setEditForm}
                      showStatus={evento.status === 'PUBLICADO'}
                      priceLocked={priceLocked}
                    />
                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onPress={cancelEdit}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isDisabled={isSavingEdit}
                      >
                        {isSavingEdit ? 'Salvando...' : 'Salvar alterações'}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-white">{lote.nome}</p>
                        <Chip size="sm" variant="soft" color={statusColor(lote.status)}>
                          {statusLabel(lote.status)}
                        </Chip>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <LotePrecoPromo
                          preco={lote.preco}
                          precoDe={lote.precoDe}
                          size="sm"
                          showLabel
                        />
                        {lote.precoDe != null && lote.precoDe > lote.preco ? (
                          <Chip size="sm" variant="soft" color="success">
                            −
                            {formatDescontoPercentual(
                              calcDescontoPercentual(lote.preco, lote.precoDe) ?? 0,
                            )}
                            %
                          </Chip>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">
                        {lote.disponiveis} disponíveis · {lote.quantidadeVendida}{' '}
                        vendidos · limite {lote.limitePorCompra}/compra
                      </p>
                      <p className="text-xs text-zinc-500">
                        Vendas: {formatEventDate(lote.vendaInicio)} até{' '}
                        {formatEventDate(lote.vendaFim)}
                      </p>
                    </div>

                    {canManage ? (
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => startEdit(lote)}
                        >
                          <Pencil className="size-3.5" aria-hidden />
                          Editar
                        </Button>
                        {lote.quantidadeVendida === 0 ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onPress={() => void handleRemove(lote)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                            Remover
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })
        )}

        {canManage && showCreateForm ? (
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
            <p className="mb-4 text-sm font-medium text-indigo-200">
              Adicionar novo lote
            </p>
            <form className="form-stack" onSubmit={handleCreate}>
              <LoteFormFields form={createForm} onChange={setCreateForm} />
              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" isDisabled={isCreating}>
                  {isCreating ? 'Salvando...' : 'Adicionar lote'}
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        {!canManage ? (
          <p className="text-xs text-zinc-500">
            Eventos cancelados ou encerrados não permitem alteração de lotes.
          </p>
        ) : null}
      </Card.Content>
    </Card>
  )
}
