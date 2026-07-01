export function normalizeCpf(value: string): string {
  return value.replace(/\D/g, '')
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
  return value.replace(/\D/g, '')
}

export function isValidTelefone(value: string): boolean {
  const digits = normalizeTelefone(value)
  return digits.length >= 10 && digits.length <= 11
}
