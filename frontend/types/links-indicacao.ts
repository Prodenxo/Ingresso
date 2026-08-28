export interface LinkIndicacaoLoteResumo {
  id: string
  nome: string
  preco: number
}

export interface LinkIndicacao {
  id: string
  empresaId: string
  eventoId: string
  loteId: string | null
  descontoPercentual: number | null
  nome: string
  slug: string
  ativo: boolean
  cliques: number
  createdAt: string
  updatedAt: string
  lote?: LinkIndicacaoLoteResumo | null
}

export interface LinkIndicacaoPublico {
  slug: string
  nome: string
  eventoId: string
  eventoNome: string
  empresaNome: string
  loteId: string | null
  loteNome: string | null
  lotePreco: number | null
  descontoPercentual: number | null
  precoComDesconto: number | null
}

export interface LinkIndicacaoRelatorioItem {
  link: Pick<
    LinkIndicacao,
    | 'id'
    | 'nome'
    | 'slug'
    | 'ativo'
    | 'cliques'
    | 'createdAt'
    | 'loteId'
    | 'descontoPercentual'
  > & {
    loteNome: string | null
  }
  metricas: {
    cliques: number
    pedidosIniciados: number
    pedidosPagos: number
    receita: number
    taxaConversao: number
  }
  pedidos: Array<{
    id: string
    codigo: string
    status: string
    total: number
    compradorNome: string
    compradorEmail: string
    createdAt: string
  }>
}
