export interface LoteDisponivel {
  id: string
  nome: string
  preco: number
  precoDe: number | null
  disponiveis: number
  vendaFim: string
  limitePorCompra: number
}

export interface EventoDisponivel {
  id: string
  nome: string
  slug: string
  descricao: string | null
  dataInicio: string
  dataFim: string | null
  cidade: string | null
  estado: string | null
  endereco: string | null
  imagemUrl: string | null
  bannerUrl: string | null
  formato: string
  empresa: {
    id: string
    nome: string
  }
  lotes: LoteDisponivel[]
}

export interface MeuIngresso {
  id: string
  status: string
  participanteNome: string
  participanteCpf: string | null
  participanteTelefone: string | null
  qrCodeUrl: string | null
  qrCodeVisivel?: boolean
  utilizadoEm: string | null
  createdAt: string
  checkins?: Array<{
    diaEvento: number
    pontoNome: string
    pontoOrdem: number
    realizadoEm: string
  }>
  evento: {
    id: string
    nome: string
    dataInicio: string
    cidade: string | null
    estado: string | null
    modoCheckin?: 'PORTA_UNICA' | 'BATE_PONTO'
    checkinDias?: number
    pontosCheckin?: Array<{ id: string; ordem: number; nome: string }>
  }
  lote: {
    id: string
    nome: string
    preco: string
  }
}
