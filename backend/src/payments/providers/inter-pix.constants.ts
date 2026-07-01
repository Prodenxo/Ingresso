import type { GatewayAmbiente } from '../../configuracoes/gateway-pagamento.types'

export const INTER_PIX_BASE_URLS: Record<GatewayAmbiente, string> = {
  sandbox: 'https://cdpj-sandbox.partners.uatinter.co',
  producao: 'https://cdpj.partners.bancointer.com.br',
}

export const INTER_PIX_OAUTH_SCOPES = [
  'cob.read',
  'cob.write',
  'pix.read',
  'pix.write',
  'webhook.read',
  'webhook.write',
].join(' ')

export const INTER_BOLETO_OAUTH_SCOPES = [
  'boleto-cobranca.read',
  'boleto-cobranca.write',
].join(' ')

export const INTER_PIX_REQUEST_TIMEOUT_MS = 30_000
