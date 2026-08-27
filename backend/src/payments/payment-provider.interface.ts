import type {
  InterGatewayCredenciais,
  InfinityPayGatewayCredenciais,
} from '../configuracoes/gateway-pagamento.types'

export interface PaymentConnectionResult {
  ok: boolean
  message?: string
  /** true quando os escopos Pix (cobrança imediata) foram aceitos pelo Inter */
  pixHabilitado?: boolean
}

export interface PixChargeParams {
  creds: InterGatewayCredenciais
  pedidoId: string
  valor: number
  pedidoCodigo: string
  descricao: string
  expiraEm: Date
}

export interface PixChargeResult {
  txid: string
  pixCopiaCola: string
  location?: string
}

export interface PaymentProvider {
  testConnection(
    creds: InterGatewayCredenciais,
  ): Promise<PaymentConnectionResult>

  createPixCharge(params: PixChargeParams): Promise<PixChargeResult>
}
