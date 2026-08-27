'use client'

import { Button, Card, Chip, Label } from '@heroui/react'
import { AlertCircle, CheckCircle2, CreditCard, PlugZap, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { GatewayInterPagamentosForm } from '@/components/configuracoes/gateway-inter-pagamentos-form'
import { FormField } from '@/components/ui/form-field'
import { ApiError, apiFetch } from '@/lib/api-client'
import type {
  GatewayPagamentoResumo,
  GatewayProvider,
  SalvarGatewayPagamentoPayload,
  TestarConexaoPagamentoResponse,
} from '@/types/configuracoes'

const selectClassName =
  'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/25'

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

export function GatewayPagamentosForm() {
  const [resumo, setResumo] = useState<GatewayPagamentoResumo | null>(null)
  const [provider, setProvider] = useState<GatewayProvider>('inter-pix')
  const [handle, setHandle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadResumo = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await apiFetch<GatewayPagamentoResumo>(
        '/configuracoes/pagamentos',
      )
      setResumo(data)
      setProvider(data.provider ?? 'inter-pix')
      setHandle('')
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

  async function handleSalvarInfinityPay(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const handleValue = handle.trim().replace(/^\$+/, '')

    if (!handleValue && !resumo?.handleMascarado) {
      setError('InfiniteTag (handle) é obrigatório')
      return
    }

    setIsSaving(true)

    const payload: SalvarGatewayPagamentoPayload = {
      provider: 'infinitypay',
      ambiente: 'producao',
    }

    if (handleValue) {
      payload.clientId = handleValue
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
      setProvider('infinitypay')
      setHandle('')
      setSuccess('InfinitePay configurado com sucesso.')
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

      if (data.testeOk) {
        setSuccess(data.testeMensagem ?? 'Conexão validada com sucesso.')
      } else {
        setError(data.testeMensagem ?? data.ultimoErro ?? 'Falha ao testar conexão')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao testar conexão')
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
      setHandle('')
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
        <p className="text-sm text-zinc-400">Carregando pagamentos...</p>
      </Card>
    )
  }

  return (
    <Card className="glass-panel rounded-2xl border-white/10 p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <CreditCard className="size-5 text-indigo-300" aria-hidden />
            <h2 className="text-lg font-medium text-white">Gateway de pagamento</h2>
          </div>
          <p className="text-sm text-zinc-400">
            Escolha o provedor por empresa. InfinitePay aceita Pix e cartão; Inter
            aceita Pix e boleto.
          </p>
        </div>
        {resumo?.configurado ? (
          <Chip color={statusColor(resumo.status)} variant="soft" size="sm">
            {statusLabel(resumo.status)}
          </Chip>
        ) : null}
      </div>

      {error ? (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
          {success}
        </p>
      ) : null}

      <div className="mb-6 space-y-2">
        <Label htmlFor="provider">Provedor</Label>
        <select
          id="provider"
          className={selectClassName}
          value={provider}
          onChange={(event) =>
            setProvider(event.target.value as GatewayProvider)
          }
        >
          <option value="inter-pix">Banco Inter (Pix + Boleto)</option>
          <option value="infinitypay">InfinitePay (Pix + Cartão)</option>
        </select>
      </div>

      {resumo?.configurado && resumo.provider !== provider ? (
        <p className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Esta empresa usa{' '}
          <strong>
            {resumo.provider === 'infinitypay' ? 'InfinitePay' : 'Banco Inter'}
          </strong>
          . Remova a configuração atual antes de trocar de provedor.
        </p>
      ) : null}

      {resumo?.configurado ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-zinc-300">
          <p>
            Provedor ativo:{' '}
            <span className="font-medium text-white">
              {resumo.provider === 'infinitypay' ? 'InfinitePay' : 'Banco Inter'}
            </span>
          </p>
          {resumo.provider === 'infinitypay' && resumo.handleMascarado ? (
            <p className="mt-1">InfiniteTag: {resumo.handleMascarado}</p>
          ) : null}
          {resumo.conectadoEm ? (
            <p className="mt-1 text-zinc-500">
              Conectado em {formatDateTime(resumo.conectadoEm)}
            </p>
          ) : null}
          {resumo.ultimoErro ? (
            <p className="mt-2 text-amber-300">{resumo.ultimoErro}</p>
          ) : null}
        </div>
      ) : null}

      {provider === 'infinitypay' ? (
        <form className="space-y-4" onSubmit={(event) => void handleSalvarInfinityPay(event)}>
          <FormField
            id="handle"
            label="InfiniteTag (handle)"
            name="handle"
            value={handle}
            onChange={(event) => setHandle(event.target.value)}
            placeholder="sua_empresa"
          />
          {resumo?.handleMascarado ? (
            <p className="text-xs text-zinc-500">
              Atual: {resumo.handleMascarado}. Deixe em branco para manter.
            </p>
          ) : (
            <p className="text-xs text-zinc-500">
              Nome da conta InfinitePay sem o $ inicial
            </p>
          )}

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-100">
            O cliente será redirecionado ao checkout InfinitePay para pagar com
            Pix ou cartão em até 12x. Configure o webhook apontando para o backend
            em produção (`BACKEND_PUBLIC_URL`).
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="primary" isDisabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar InfinitePay'}
            </Button>
            {resumo?.configurado && resumo.provider === 'infinitypay' ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  isDisabled={isTesting}
                  onPress={() => void handleTestarConexao()}
                >
                  <PlugZap className="size-4" aria-hidden />
                  {isTesting ? 'Testando...' : 'Testar conexão'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  isDisabled={isRemoving}
                  onPress={() => void handleRemove()}
                >
                  <Trash2 className="size-4" aria-hidden />
                  Remover
                </Button>
              </>
            ) : null}
          </div>
        </form>
      ) : resumo?.configurado && resumo.provider !== 'inter-pix' ? (
        <p className="text-sm text-zinc-400">
          Remova a configuração InfinitePay acima para configurar o Banco Inter.
        </p>
      ) : (
        <GatewayInterPagamentosForm embedded />
      )}
    </Card>
  )
}
