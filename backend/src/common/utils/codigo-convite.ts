import { randomBytes } from 'crypto'

const CODIGO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function gerarCodigoConvite(length = 8): string {
  const bytes = randomBytes(length)
  let codigo = ''

  for (let i = 0; i < length; i += 1) {
    codigo += CODIGO_CHARS[bytes[i]! % CODIGO_CHARS.length]
  }

  return codigo
}
