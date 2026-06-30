'use client'

import { Button } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AdminShell } from '@/components/layout/admin-shell'
import { FormField } from '@/components/ui/form-field'
import { ApiError, apiFetch } from '@/lib/api-client'
import type { EventoAdmin } from '@/types/eventos'

export default function NovoEventoPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    dataInicio: '',
    dataFim: '',
    cidade: '',
    estado: '',
    endereco: '',
  })

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const evento = await apiFetch<EventoAdmin>('/eventos', {
        method: 'POST',
        body: JSON.stringify({
          nome: form.nome,
          descricao: form.descricao || undefined,
          dataInicio: new Date(form.dataInicio).toISOString(),
          dataFim: form.dataFim
            ? new Date(form.dataFim).toISOString()
            : undefined,
          cidade: form.cidade || undefined,
          estado: form.estado || undefined,
          endereco: form.endereco || undefined,
          formato: 'PRESENCIAL',
        }),
      })

      router.push(`/eventos/${evento.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar evento')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AdminShell title="Novo evento" subtitle="Após criar, adicione o flyer na tela de gerenciamento">
      <form
        className="glass-panel form-stack mx-auto max-w-2xl rounded-2xl p-6 md:p-8"
        onSubmit={handleSubmit}
      >
        <FormField
          label="Nome do evento"
          name="nome"
          value={form.nome}
          onChange={(e) => updateField('nome', e.target.value)}
          placeholder="Ex.: Festival de Verão 2026"
          required
        />

        <FormField
          label="Descrição"
          name="descricao"
          value={form.descricao}
          onChange={(e) => updateField('descricao', e.target.value)}
          placeholder="Descreva o evento (opcional)"
        />

        <div className="form-row-2">
          <FormField
            label="Início"
            name="dataInicio"
            type="datetime-local"
            value={form.dataInicio}
            onChange={(e) => updateField('dataInicio', e.target.value)}
            required
          />
          <FormField
            label="Fim (opcional)"
            name="dataFim"
            type="datetime-local"
            value={form.dataFim}
            onChange={(e) => updateField('dataFim', e.target.value)}
          />
        </div>

        <div className="form-row-2">
          <FormField
            label="Cidade"
            name="cidade"
            value={form.cidade}
            onChange={(e) => updateField('cidade', e.target.value)}
            placeholder="São Paulo"
          />
          <FormField
            label="Estado"
            name="estado"
            value={form.estado}
            onChange={(e) => updateField('estado', e.target.value)}
            placeholder="SP"
            maxLength={2}
          />
        </div>

        <FormField
          label="Endereço"
          name="endereco"
          value={form.endereco}
          onChange={(e) => updateField('endereco', e.target.value)}
          placeholder="Rua, número, bairro"
        />

        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" isDisabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Criar evento'}
          </Button>
        </div>
      </form>
    </AdminShell>
  )
}
