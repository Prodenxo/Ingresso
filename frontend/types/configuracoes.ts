export type GatewayProvider = 'inter-pix' | 'infinitypay'

export type GatewayAmbiente = 'sandbox' | 'producao'

export type GatewayStatus = 'pendente' | 'conectado' | 'erro'

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

export interface SalvarGatewayPagamentoPayload {
  provider: GatewayProvider
  ambiente?: GatewayAmbiente
  clientId?: string
  clientSecret?: string
  certificadoPem?: string
  chavePrivadaPem?: string
  chavePix?: string
  webhookSecret?: string
}
