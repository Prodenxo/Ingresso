export const GATEWAY_PROVIDERS = ['inter-pix', 'infinitypay'] as const

export const GATEWAY_AMBIENTES = ['sandbox', 'producao'] as const

export const GATEWAY_STATUS = ['pendente', 'conectado', 'erro'] as const

export type GatewayProvider = (typeof GATEWAY_PROVIDERS)[number]

export type GatewayAmbiente = (typeof GATEWAY_AMBIENTES)[number]

export type GatewayStatus = (typeof GATEWAY_STATUS)[number]

export interface GatewayPagamentoResumo {
  configurado: boolean
  provider: GatewayProvider | null
  ambiente: GatewayAmbiente | null
  status: GatewayStatus | null
  clientIdMascarado: string | null
  handleMascarado: string | null
  temClientSecret: boolean
  temCertificado: boolean
  temChavePrivada: boolean
  temWebhookSecret: boolean
  chavePix: string | null
  conectadoEm: string | null
  ultimoErro: string | null
  atualizadoEm: string | null
}

export interface TestarConexaoPagamentoResponse extends GatewayPagamentoResumo {
  testeOk: boolean
  testeMensagem: string | null
  pixHabilitado: boolean
}

export interface InterGatewayCredenciais {
  provider: 'inter-pix'
  ambiente: GatewayAmbiente
  clientId: string
  clientSecret: string
  certificadoPem: string
  chavePrivadaPem: string
  webhookSecret: string | null
  chavePix: string | null
}

export interface InfinityPayGatewayCredenciais {
  provider: 'infinitypay'
  ambiente: GatewayAmbiente
  handle: string
}

export type GatewayPagamentoCredenciais =
  | InterGatewayCredenciais
  | InfinityPayGatewayCredenciais

export function isInterGatewayCredenciais(
  creds: GatewayPagamentoCredenciais,
): creds is InterGatewayCredenciais {
  return creds.provider === 'inter-pix'
}

export function isInfinityPayGatewayCredenciais(
  creds: GatewayPagamentoCredenciais,
): creds is InfinityPayGatewayCredenciais {
  return creds.provider === 'infinitypay'
}
