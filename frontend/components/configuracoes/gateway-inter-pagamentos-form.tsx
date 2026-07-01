'use client'

import { Button, Card, Chip, Label } from '@heroui/react'
import { AlertCircle, CheckCircle2, CreditCard, PlugZap, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { PemFileField } from '@/components/configuracoes/pem-file-field'
import { FormField } from '@/components/ui/form-field'
import { ApiError, apiFetch } from '@/lib/api-client'
import type {
  GatewayPagamentoResumo,
  SalvarGatewayPagamentoPayload,
  TestarConexaoPagamentoResponse,
} from '@/types/configuracoes'

const selectClassName =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/25'

interface FormState {
  ambiente: 'sandbox' | 'producao'
  clientId: string
  clientSecret: string
  certificadoPem: string
  chavePrivadaPem: string
  chavePix: string
  webhookSecret: string
}

const emptyForm: FormState = {
  ambiente: 'sandbox',
  clientId: '',
  clientSecret: '',
  certificadoPem: '',
  chavePrivadaPem: '',
  chavePix: '',
  webhookSecret: '',
}

function statusLabel(status: GatewayPagamentoResumo['status']): string {
  if (status === 'conectado') return 'Conectado'
  if (status === 'erro') return 'Erro'
  if (status === 'pendente') return 'Parcial'
  return 'Não configurado'
}

function statusColor(
  status: GatewayPagamentoResumo['status'],
): 'success' | 'warning' | 'danger' | 'accent' {
  if (status === 'conectado') return 'success'
  if (status === 'erro') return 'danger'
  if (status === 'pendente') return 'warning'
  return 'accent'
}

function formatDateTime(value: string | null): string | null {
  if (!value) return null

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function GatewayInterPagamentosForm() {
  const [resumo, setResumo] = useState<GatewayPagamentoResumo | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [certificadoFileName, setCertificadoFileName] = useState<string | null>(null)
  const [chavePrivadaFileName, setChavePrivadaFileName] = useState<string | null>(null)

  const loadResumo = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<GatewayPagamentoResumo>(
        '/configuracoes/pagamentos',
      )
      setResumo(data)
      setForm((current) => ({
        ...current,
        ambiente: data.ambiente ?? 'sandbox',
        chavePix: data.chavePix ?? '',
        clientId: data.configurado ? '' : current.clientId,
        clientSecret: '',
        certificadoPem: '',
        chavePrivadaPem: '',
        webhookSecret: '',
      }))
      setCertificadoFileName(null)
      setChavePrivadaFileName(null)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar as configurações de pagamento',
      )
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadResumo()
  }, [loadResumo])

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setSuccess(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    setIsSaving(true)

    const payload: SalvarGatewayPagamentoPayload = {
      provider: 'inter-pix',
      ambiente: form.ambiente,
      chavePix: form.chavePix.trim() || undefined,
    }

    if (form.clientId.trim()) {
      payload.clientId = form.clientId.trim()
    } else if (!resumo?.configurado) {
      setError('Client ID é obrigatório')
      setIsSaving(false)
      return
    }

    if (form.clientSecret.trim()) {
      payload.clientSecret = form.clientSecret.trim()
    } else if (!resumo?.temClientSecret) {
      setError('Client Secret é obrigatório')
      setIsSaving(false)
      return
    } else if (resumo?.configurado && form.clientId.trim()) {
      setError('Ao alterar o Client ID, informe o Client Secret novamente')
      setIsSaving(false)
      return
    }

    if (form.certificadoPem.trim()) {
      payload.certificadoPem = form.certificadoPem.trim()
    } else if (!resumo?.temCertificado) {
      setError('Selecione o arquivo do certificado (.crt)')
      setIsSaving(false)
      return
    }

    if (form.chavePrivadaPem.trim()) {
      payload.chavePrivadaPem = form.chavePrivadaPem.trim()
    } else if (!resumo?.temChavePrivada) {
      setError('Selecione o arquivo da chave privada (.key)')
      setIsSaving(false)
      return
    }

    if (form.webhookSecret.trim()) {
      payload.webhookSecret = form.webhookSecret.trim()
    }

    try {
      const data = await apiFetch<GatewayPagamentoResumo>(
        '/configuracoes/pagamentos',
        {
          method: 'PUT',
          body: JSON.stringify(payload),
        },
      )
      setResumo(data)
      setForm((current) => ({
        ...current,
        clientId: '',
        clientSecret: '',
        certificadoPem: '',
        chavePrivadaPem: '',
        webhookSecret: '',
        chavePix: data.chavePix ?? '',
        ambiente: data.ambiente ?? current.ambiente,
      }))
      setCertificadoFileName(null)
      setChavePrivadaFileName(null)
      setSuccess('Configuração salva com sucesso.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar configuração')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleTestarConexao() {
    setError(null)
    setSuccess(null)
    setIsTesting(true)

    try {
      const data = await apiFetch<TestarConexaoPagamentoResponse>(
        '/configuracoes/pagamentos/testar',
        { method: 'POST' },
      )
      setResumo(data)

      if (data.testeOk && data.pixHabilitado) {
        setSuccess(data.testeMensagem ?? 'Pix habilitado e conexão validada.')
      } else if (data.testeOk && !data.pixHabilitado) {
        setSuccess(
          data.testeMensagem ??
            'Credenciais válidas (boleto). Habilite Pix Cobrança no portal Inter.',
        )
      } else if (data.ultimoErro) {
        setError(data.ultimoErro)
      } else {
        setError(data.testeMensagem ?? 'Não foi possível validar a conexão com o Banco Inter')
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Erro ao testar conexão com o Banco Inter',
      )
    } finally {
      setIsTesting(false)
    }
  }

  async function handleRemove() {
    if (!window.confirm('Remover a configuração de pagamento desta empresa?')) {
      return
    }

    setError(null)
    setSuccess(null)
    setIsRemoving(true)

    try {
      await apiFetch<{ message: string }>('/configuracoes/pagamentos', {
        method: 'DELETE',
      })
      setResumo(null)
      setForm(emptyForm)
      setCertificadoFileName(null)
      setChavePrivadaFileName(null)
      setSuccess('Configuração removida.')
      await loadResumo()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover configuração')
    } finally {
      setIsRemoving(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="glass-panel rounded-2xl border-white/10 p-6">
        <p className="text-sm text-zinc-400">Carregando configurações...</p>
      </Card>
    )
  }

  const precisaClientId = !resumo?.configurado
  const precisaCertificado = !resumo?.temCertificado
  const precisaChavePrivada = !resumo?.temChavePrivada

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {resumo?.configurado ? (
        <Card className="glass-panel rounded-2xl border-white/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Status atual
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Chip size="sm" variant="soft" color={statusColor(resumo.status)}>
                  {statusLabel(resumo.status)}
                </Chip>
                <span className="text-sm text-zinc-400">
                  Inter Pix · {resumo.ambiente === 'producao' ? 'Produção' : 'Sandbox'}
                </span>
              </div>
              {resumo.clientIdMascarado ? (
                <p className="mt-2 text-sm text-zinc-300">
                  Client ID:{' '}
                  <span className="font-mono text-zinc-100">
                    {resumo.clientIdMascarado}
                  </span>
                </p>
              ) : null}
              {resumo.atualizadoEm ? (
                <p className="mt-1 text-xs text-zinc-500">
                  Atualizado em {formatDateTime(resumo.atualizadoEm)}
                </p>
              ) : null}
            </div>
            <CreditCard className="size-8 text-indigo-400/80" aria-hidden />
          </div>

          {resumo.ultimoErro ? (
            <p
              className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                resumo.status === 'pendente'
                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                  : 'border-red-500/20 bg-red-500/10 text-red-300'
              }`}
            >
              {resumo.ultimoErro}
            </p>
          ) : null}

          <ul className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-400 sm:grid-cols-4">
            <li>{resumo.temClientSecret ? '✓ Secret' : '✗ Secret'}</li>
            <li>{resumo.temCertificado ? '✓ Certificado' : '✗ Certificado'}</li>
            <li>{resumo.temChavePrivada ? '✓ Chave privada' : '✗ Chave privada'}</li>
            <li>{resumo.temWebhookSecret ? '✓ Webhook secret' : '— Webhook'}</li>
          </ul>
        </Card>
      ) : null}

      <form
        className="glass-panel form-stack rounded-2xl p-6 md:p-8"
        onSubmit={handleSubmit}
      >
        <div>
          <h2 className="text-lg font-medium text-white">Inter Pix</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Credenciais da conta PJ no Inter. Os dados sensíveis ficam criptografados
            no servidor.
          </p>
        </div>

        {error ? (
          <p className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
            {success}
          </p>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="ambiente">Ambiente</Label>
          <select
            id="ambiente"
            name="ambiente"
            className={selectClassName}
            value={form.ambiente}
            onChange={(event) =>
              updateField('ambiente', event.target.value as FormState['ambiente'])
            }
          >
            <option value="sandbox">Sandbox (testes)</option>
            <option value="producao">Produção</option>
          </select>
        </div>

        <FormField
          label={resumo?.configurado ? 'Client ID (novo, se for trocar)' : 'Client ID'}
          name="clientId"
          value={form.clientId}
          onChange={(event) => updateField('clientId', event.target.value)}
          placeholder={
            resumo?.configurado
              ? `Atual: ${resumo.clientIdMascarado ?? '—'}`
              : 'Cole o Client ID do portal Inter'
          }
          required={precisaClientId}
          autoComplete="off"
        />

        <FormField
          label="Client Secret"
          name="clientSecret"
          type="password"
          value={form.clientSecret}
          onChange={(event) => updateField('clientSecret', event.target.value)}
          placeholder={
            resumo?.temClientSecret
              ? 'Cole novamente para confirmar ou atualizar'
              : 'Cole o Client Secret'
          }
          required={!resumo?.temClientSecret || resumo?.status === 'erro'}
          autoComplete="off"
        />
        {resumo?.status === 'erro' ? (
          <p className="text-xs text-amber-300/90">
            Se o teste falhou, re-digite o Client Secret (copie do portal Inter),
            salve e teste de novo. Certificado e chave devem ser do mesmo download
            dessa integração.
          </p>
        ) : null}

        <PemFileField
          id="certificadoPem"
          label="Certificado (.crt)"
          kind="certificate"
          required={precisaCertificado}
          selectedFileName={certificadoFileName}
          savedHint={
            resumo?.temCertificado
              ? 'Certificado já salvo — escolha um arquivo para substituir'
              : 'Nenhum arquivo selecionado'
          }
          onLoaded={(content, fileName) => {
            updateField('certificadoPem', content)
            setCertificadoFileName(fileName)
            setError(null)
          }}
          onClear={() => {
            updateField('certificadoPem', '')
            setCertificadoFileName(null)
          }}
          onError={setError}
        />

        <PemFileField
          id="chavePrivadaPem"
          label="Chave privada (.key)"
          kind="private-key"
          required={precisaChavePrivada}
          selectedFileName={chavePrivadaFileName}
          savedHint={
            resumo?.temChavePrivada
              ? 'Chave já salva — escolha um arquivo para substituir'
              : 'Nenhum arquivo selecionado'
          }
          onLoaded={(content, fileName) => {
            updateField('chavePrivadaPem', content)
            setChavePrivadaFileName(fileName)
            setError(null)
          }}
          onClear={() => {
            updateField('chavePrivadaPem', '')
            setChavePrivadaFileName(null)
          }}
          onError={setError}
        />

        <FormField
          label="Chave Pix (opcional)"
          name="chavePix"
          value={form.chavePix}
          onChange={(event) => updateField('chavePix', event.target.value)}
          placeholder="email@empresa.com ou CNPJ"
        />

        <FormField
          label="Webhook secret (opcional)"
          name="webhookSecret"
          type="password"
          value={form.webhookSecret}
          onChange={(event) => updateField('webhookSecret', event.target.value)}
          placeholder={
            resumo?.temWebhookSecret
              ? 'Deixe em branco para manter'
              : 'Secret para validar webhooks do Inter'
          }
          autoComplete="off"
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" variant="primary" isDisabled={isSaving || isTesting}>
            {isSaving ? 'Salvando...' : 'Salvar configuração'}
          </Button>

          {resumo?.configurado ? (
            <Button
              type="button"
              variant="secondary"
              isDisabled={isTesting || isSaving}
              onPress={() => void handleTestarConexao()}
            >
              <PlugZap className="size-4" aria-hidden />
              {isTesting ? 'Testando...' : 'Testar conexão'}
            </Button>
          ) : null}

          {resumo?.configurado ? (
            <Button
              type="button"
              variant="ghost"
              isDisabled={isRemoving || isTesting}
              onPress={() => void handleRemove()}
            >
              <Trash2 className="size-4" aria-hidden />
              {isRemoving ? 'Removendo...' : 'Remover'}
            </Button>
          ) : null}
        </div>
      </form>
    </div>
  )
}
