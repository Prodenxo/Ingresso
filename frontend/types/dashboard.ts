export interface PedidoResumo {
  id: string
  codigo: string
  status: string
  total: number
  compradorNome: string
  compradorEmail?: string
  eventoNome: string
  ingressos?: number
  createdAt: string
}

export interface DashboardOverview {
  eventosPublicados: number
  eventosTotal: number
  ingressosVendidos: number
  ingressosDisponiveis: number
  pedidosPendentes: number
  taxaOcupacao: number
  pedidosRecentes: PedidoResumo[]
}

export interface FinanceiroResumo {
  receita: number
  pedidosPagos: number
  pedidosPendentes: number
  ticketMedio: number
  pedidos: PedidoResumo[]
}
