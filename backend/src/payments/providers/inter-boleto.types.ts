export interface InterEmitirCobrancaRequest {
  seuNumero: string
  valorNominal: number
  dataVencimento: string
  numDiasAgenda: number
  pagador: {
    cpfCnpj: string
    tipoPessoa: 'FISICA' | 'JURIDICA'
    nome: string
    email?: string
    ddd?: string
    telefone?: string
    cep?: string
    endereco?: string
    numero?: string
    bairro?: string
    cidade?: string
    uf?: string
  }
}

export interface InterCobrancaDetalhe {
  codigoSolicitacao?: string
  seuNumero?: string
  situacao?: string
  dataVencimento?: string
  valorNominal?: number
  boleto?: {
    nossoNumero?: string
    codigoBarras?: string
    linhaDigitavel?: string
  }
}

export interface InterEmitirCobrancaResponse {
  codigoSolicitacao?: string
}

export interface InterConsultarCobrancaResponse {
  cobranca?: InterCobrancaDetalhe
}

export const INTER_BOLETO_SITUACOES_PAGAS = [
  'RECEBIDO',
  'MARCADO_RECEBIDO',
  'PAGO',
] as const
