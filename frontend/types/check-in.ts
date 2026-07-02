export interface PontoCheckin {
  id: string
  ordem: number
  nome: string
}

export interface CheckInEvento {
  id: string
  nome: string
  dataInicio: string
  dataFim: string | null
  cidade: string | null
  estado: string | null
  status: string
  modoCheckin: 'PORTA_UNICA' | 'BATE_PONTO'
  checkinDias: number
  pontosCheckin: PontoCheckin[]
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
  resultado:
    | 'VALIDO'
    | 'JA_UTILIZADO'
    | 'JA_REGISTRADO'
    | 'SEQUENCIA_INVALIDA'
    | 'INVALIDO'
  motivo?: string
  ingresso?: CheckInIngressoResumo
  checkin?: {
    realizadoEm: string
    operadorNome?: string
    local?: string | null
    pontoNome?: string
    diaEvento?: number
  } | null
}

export interface CheckInRelatorio {
  evento: {
    id: string
    nome: string
    checkinDias: number
    pontosCheckin: PontoCheckin[]
  }
  resumo: {
    totalParticipantes: number
    completos: number
    comInconsistencia: number
    soDia1: number
    soDia2: number
  }
  participantes: Array<{
    ingressoId: string
    participanteNome: string
    participanteEmail: string
    codigo: string | null
    loteNome: string
    status: string
    registros: Array<{
      diaEvento: number
      pontoId: string
      pontoOrdem: number
      pontoNome: string
      realizadoEm: string
    }>
    totalRegistros: number
    totalEsperado: number
    inconsistencia: string | null
  }>
}
