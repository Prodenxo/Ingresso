import type { PapelUsuario, TipoConta } from '@prisma/client'

export interface AuthUserResponse {
  id: string
  nome: string
  email: string
  tipoConta: TipoConta
  empresas: Array<{
    id: string
    nome: string
    cnpj: string
    papel: PapelUsuario
    acessoCursos: boolean
  }>
}

export interface AuthTokensResponse {
  accessToken: string
  refreshToken: string
  expiresIn: string
  user: AuthUserResponse
}
