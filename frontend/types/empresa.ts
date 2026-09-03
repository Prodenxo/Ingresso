export interface EmpresaResumo {
  id: string
  nome: string
  razaoSocial: string | null
  cnpj: string
  corPrimaria: string | null
  logoUrl: string | null
  createdAt: string
  totalEventos?: number
  totalMembros?: number
}
