const UFS_VALIDAS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])

export const INTER_BOLETO_VALOR_MINIMO = 2.5

export function formatInterPagadorTelefone(
  telefone?: string | null,
): { ddd?: string; telefone?: string } {
  const digits = (telefone ?? '').replace(/\D/g, '')

  if (digits.length < 10) {
    return {}
  }

  const ddd = digits.slice(0, 2)
  const numero = digits.slice(2).slice(0, 9)

  if (!numero) {
    return {}
  }

  return { ddd, telefone: numero }
}

export function normalizeInterUf(estado?: string | null): string {
  const uf = (estado ?? '').trim().toUpperCase().slice(0, 2)
  return UFS_VALIDAS.has(uf) ? uf : 'SP'
}

export function normalizeInterCidade(
  cidade?: string | null,
  uf?: string,
): string {
  const value = (cidade ?? '').trim()

  if (!value || value.length <= 2 || value.toUpperCase() === uf?.toUpperCase()) {
    return 'Sao Paulo'
  }

  return value.slice(0, 60)
}

export function decodeInterPdfResponse(rawBody: string, data: unknown): Buffer {
  if (rawBody.startsWith('%PDF')) {
    return Buffer.from(rawBody, 'binary')
  }

  if (typeof data === 'object' && data !== null) {
    const record = data as Record<string, unknown>

    for (const key of ['pdf', 'arquivo', 'conteudo', 'base64', 'data']) {
      const value = record[key]

      if (typeof value === 'string' && value.length > 0) {
        return Buffer.from(value.replace(/\s/g, ''), 'base64')
      }
    }
  }

  if (typeof data === 'string' && data.length > 0) {
    return Buffer.from(data.replace(/\s/g, ''), 'base64')
  }

  const trimmed = rawBody.trim()

  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 100) {
    return Buffer.from(trimmed.replace(/\s/g, ''), 'base64')
  }

  throw new Error('Resposta do Inter não contém PDF do boleto')
}
