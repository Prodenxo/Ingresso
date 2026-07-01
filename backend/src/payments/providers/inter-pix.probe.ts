import type { GatewayPagamentoCredenciais } from '../../configuracoes/gateway-pagamento.types'
import {
  INTER_BOLETO_OAUTH_SCOPES,
  INTER_PIX_OAUTH_SCOPES,
} from './inter-pix.constants'
import { mapInterHttpError, mapInterNetworkError } from './inter-pix.errors'
import { requestInterOAuthToken } from './inter-pix.oauth'

export interface InterScopeProbeResult {
  label: string
  ok: boolean
  detail: string
}

const INTER_TEST_SCOPE_SETS: Array<{ label: string; scope: string }> = [
  { label: 'Pix Cobrança', scope: INTER_PIX_OAUTH_SCOPES },
  { label: 'Boleto', scope: INTER_BOLETO_OAUTH_SCOPES },
  { label: 'Extrato', scope: 'extrato.read' },
  { label: 'Sem escopo', scope: '' },
]

export async function probeInterOAuthScopes(
  baseUrl: string,
  creds: GatewayPagamentoCredenciais,
  timeoutMs: number,
): Promise<InterScopeProbeResult[]> {
  const results: InterScopeProbeResult[] = []

  for (const item of INTER_TEST_SCOPE_SETS) {
    try {
      const token = await requestInterOAuthToken(
        baseUrl,
        creds,
        timeoutMs,
        item.scope,
      )

      results.push({
        label: item.label,
        ok: Boolean(token.access_token),
        detail: token.access_token ? 'Token obtido' : 'Resposta sem access_token',
      })
    } catch (error) {
      results.push({
        label: item.label,
        ok: false,
        detail:
          error instanceof Error
            ? error.message
            : mapInterNetworkError(error),
      })
    }
  }

  return results
}

export function summarizeInterScopeProbes(
  probes: InterScopeProbeResult[],
  ambienteLabel: string,
): { ok: boolean; pixHabilitado: boolean; message: string } {
  const pixProbe = probes.find((probe) => probe.label === 'Pix Cobrança')
  const boletoProbe = probes.find((probe) => probe.label === 'Boleto')
  const anyOk = probes.some((probe) => probe.ok)

  if (pixProbe?.ok) {
    return {
      ok: true,
      pixHabilitado: true,
      message: `Pix habilitado e conexão validada (${ambienteLabel})`,
    }
  }

  if (boletoProbe?.ok) {
    return {
      ok: true,
      pixHabilitado: false,
      message:
        `Credenciais válidas (boleto confirmado em ${ambienteLabel}). ` +
        'Habilite Pix Cobrança no portal Inter (cob.read e cob.write).',
    }
  }

  if (anyOk) {
    const passed = probes
      .filter((probe) => probe.ok)
      .map((probe) => probe.label)
      .join(', ')

    return {
      ok: true,
      pixHabilitado: false,
      message:
        `Credenciais válidas (${passed} em ${ambienteLabel}), mas Pix Cobrança ainda não está habilitado.`,
    }
  }

  const lines = probes
    .map((probe) => `${probe.label}: ${probe.detail}`)
    .join(' | ')

  return {
    ok: false,
    pixHabilitado: false,
    message: `Inter rejeitou todas as tentativas. ${lines}`,
  }
}
