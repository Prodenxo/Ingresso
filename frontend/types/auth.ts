export type TipoConta = 'PARTICIPANTE' | 'ORGANIZADOR' | 'SUPERADMIN'

export type RegisterTipo = 'empresa' | 'usuario'

export interface AuthEmpresa {
  id: string
  nome: string
  cnpj: string
  papel: string
}

export interface AuthUser {
  id: string
  nome: string
  email: string
  tipoConta: TipoConta
  empresas: AuthEmpresa[]
}

export interface AuthSession {
  accessToken: string
  refreshToken: string
  expiresIn: string
  user: AuthUser
}

export interface LoginInput {
  email: string
  senha: string
}

export interface RegisterInput {
  tipo: RegisterTipo
  nome: string
  email: string
  senha: string
  telefone?: string
  nomeEmpresa?: string
  razaoSocial?: string
  cnpj?: string
}
