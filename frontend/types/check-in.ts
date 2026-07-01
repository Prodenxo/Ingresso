export interface CheckInEvento {
  id: string
  nome: string
  dataInicio: string
  dataFim: string | null
  cidade: string | null
  estado: string | null
  status: string
  checkinsRealizados: number
}

export interface CheckInIngressoResumo {
  id: string
  participanteNome: string
  participanteEmail: string
  status: string
  codigo: string | null
  loteNome: string
  eventoNome: string
  utilizadoEm: string | null
}

export interface CheckInValidacao {
  resultado: 'VALIDO' | 'JA_UTILIZADO' | 'INVALIDO'
  motivo?: string
  ingresso?: CheckInIngressoResumo
  checkin?: {
    realizadoEm: string
    operadorNome: string
    local: string | null
  } | null
}
