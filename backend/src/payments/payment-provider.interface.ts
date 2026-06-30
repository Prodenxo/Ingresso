import type { GatewayPagamentoCredenciais } from '../configuracoes/gateway-pagamento.types'

export interface PaymentConnectionResult {
  ok: boolean
  message?: string
}

export interface PixChargeParams {
  creds: GatewayPagamentoCredenciais
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
    creds: GatewayPagamentoCredenciais,
  ): Promise<PaymentConnectionResult>

  createPixCharge(params: PixChargeParams): Promise<PixChargeResult>
}
