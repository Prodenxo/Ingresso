import { randomBytes } from 'crypto'

export function gerarTxidInter(pedidoId: string): string {
  const normalized = pedidoId.replace(/-/g, '')

  if (normalized.length >= 26 && normalized.length <= 35) {
    return normalized
  }

  const suffix = randomBytes(8).toString('hex').toUpperCase()
  return `${normalized}${suffix}`.slice(0, 35).padEnd(26, '0')
}
