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
  modoCheckin: 'PORTA_UNICA' | 'BATE_PONTO'
  checkinDias: number
  pontosCheckin?: PontoCheckinEvento[]
  createdAt: string
  updatedAt: string
  _count: {
    lotes: number
    pedidos: number
  }
}

export interface PontoCheckinEvento {
  id: string
  ordem: number
  nome: string
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
  gateway: 'mock-pix' | 'inter-pix' | 'mock-boleto' | 'inter-boleto'
  metodo?: 'PIX' | 'BOLETO'
  pixCopiaCola?: string
  linhaDigitavel?: string
  codigoBarras?: string | null
  dataVencimento?: string
  boletoPdfUrl?: string | null
  expiraEm: string | null
}

export interface PedidoStatusResponse {
  pedidoId: string
  status: string
  gateway: 'mock-pix' | 'inter-pix' | 'mock-boleto' | 'inter-boleto'
  metodo?: string
  expiraEm: string | null
  linhaDigitavel?: string | null
  boletoPdfUrl?: string | null
  ingressos: Array<{ id: string; codigo: string; participanteNome: string }>
}

export interface ParticipanteAdicionalInput {
  nome: string
  cpf: string
  telefone: string
}

export interface CheckoutRequest {
  quantidade: number
  metodo?: 'PIX' | 'BOLETO'
  compradorCpf?: string
  participantesAdicionais?: ParticipanteAdicionalInput[]
}
