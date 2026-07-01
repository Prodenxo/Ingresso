export interface ConviteEmpresaPublico {
  id: string
  nome: string
  logoUrl: string | null
  corPrimaria: string
  slugMembro: string
}

export interface ConviteConfig {
  slugMembro: string
  codigoConvite: string
}

export interface MembroVinculado {
  id: string
  usuarioId: string
  nome: string
  email: string
  telefone: string | null
  vinculadoEm: string
}

export interface VincularMembroResponse {
  message: string
  jaVinculado: boolean
  empresa: {
    id: string
    nome: string
    slugMembro: string | null
  }
}
