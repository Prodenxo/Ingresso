export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '')
}

export function formatCpf(value: string): string {
  const digits = normalizeCpf(value).slice(0, 11)

  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function isValidCpf(value: string): boolean {
  const cpf = normalizeCpf(value)

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false
  }

  let sum = 0

  for (let i = 0; i < 9; i += 1) {
    sum += Number(cpf[i]) * (10 - i)
  }

  let digit = (sum * 10) % 11
  if (digit === 10) digit = 0
  if (digit !== Number(cpf[9])) return false

  sum = 0

  for (let i = 0; i < 10; i += 1) {
    sum += Number(cpf[i]) * (11 - i)
  }

  digit = (sum * 10) % 11
  if (digit === 10) digit = 0

  return digit === Number(cpf[10])
}

export function normalizeTelefone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 11)
}

export function formatTelefone(value: string): string {
  const digits = normalizeTelefone(value)

  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isValidTelefone(value: string): boolean {
  const digits = normalizeTelefone(value)
  return digits.length >= 10 && digits.length <= 11
}

export interface ParticipanteAdicionalForm {
  nome: string
  cpf: string
  telefone: string
}

export function validarParticipantesAdicionais(
  participantes: ParticipanteAdicionalForm[],
): string | null {
  for (const [index, participante] of participantes.entries()) {
    const label = `Participante ${index + 2}`

    if (!participante.nome.trim()) {
      return `${label}: informe o nome`
    }

    if (!isValidCpf(participante.cpf)) {
      return `${label}: CPF inválido`
    }

    if (!isValidTelefone(participante.telefone)) {
      return `${label}: celular inválido`
    }
  }

  return null
}
