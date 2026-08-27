export interface LinkIndicacao {
  id: string
  empresaId: string
  eventoId: string
  nome: string
  slug: string
  ativo: boolean
  cliques: number
  createdAt: string
  updatedAt: string
}

export interface LinkIndicacaoPublico {
  slug: string
  nome: string
  eventoId: string
  eventoNome: string
}

export interface LinkIndicacaoRelatorioItem {
  link: Pick<
    LinkIndicacao,
    'id' | 'nome' | 'slug' | 'ativo' | 'cliques' | 'createdAt'
  >
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
