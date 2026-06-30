export interface EventoAdmin {
  id: string
  nome: string
  slug: string
  descricao: string | null
  dataInicio: string
  dataFim: string | null
  cidade: string | null
  estado: string | null
  endereco: string | null
  capacidade: number
  status: string
  visibilidade: string
  formato: string
  imagemUrl: string | null
  bannerUrl: string | null
  createdAt: string
  updatedAt: string
  _count: {
    lotes: number
    pedidos: number
  }
}

export interface LoteAdmin {
  id: string
  nome: string
  preco: number
  precoDe: number | null
  quantidade: number
  quantidadeVendida: number
  disponiveis: number
  vendaInicio: string
  vendaFim: string
  limitePorCompra: number
  status: string
}

export interface EventoDetalhe extends Omit<EventoAdmin, '_count'> {
  empresaId: string
  lotes: LoteAdmin[]
}

export interface CheckoutResponse {
  pedidoId: string
  codigo: string
  total: number
  status: string
  gateway: 'mock-pix' | 'inter-pix'
  pixCopiaCola: string
  expiraEm: string | null
}

export interface PedidoStatusResponse {
  pedidoId: string
  status: string
  gateway: 'mock-pix' | 'inter-pix'
  expiraEm: string | null
  ingressos: Array<{ id: string; codigo: string }>
}
