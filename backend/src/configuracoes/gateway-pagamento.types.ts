export const GATEWAY_PROVIDERS = ['inter-pix'] as const

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
  temClientSecret: boolean
  temCertificado: boolean
  temChavePrivada: boolean
  temWebhookSecret: boolean
  chavePix: string | null
  conectadoEm: string | null
  ultimoErro: string | null
  atualizadoEm: string | null
}

export interface GatewayPagamentoCredenciais {
  provider: GatewayProvider
  ambiente: GatewayAmbiente
  clientId: string
  clientSecret: string
  certificadoPem: string
  chavePrivadaPem: string
  webhookSecret: string | null
  chavePix: string | null
}
