interface InterOAuthErrorBody {
  error?: string
  error_description?: string
  message?: string
  title?: string
  detail?: string
}

export function mapInterHttpError(
  statusCode: number,
  body: unknown,
  rawBody: string,
): string {
  const payload = (body ?? {}) as InterOAuthErrorBody
  const detail =
    payload.error_description ??
    payload.detail ??
    payload.message ??
    payload.title ??
    payload.error

  if (statusCode === 401) {
    return detail
      ? `Credenciais inválidas: ${detail}`
      : 'Client ID ou Client Secret incorretos'
  }

  if (statusCode === 403) {
    return detail
      ? `Permissão negada: ${detail}`
      : 'Integração sem permissão para os escopos Pix. Verifique as permissões no portal Inter'
  }

  if (statusCode === 0 || statusCode >= 500) {
    return 'Banco Inter indisponível no momento. Tente novamente em instantes'
  }

  if (detail) {
    return detail
  }

  if (rawBody && rawBody.length < 200) {
    return rawBody
  }

  return `Erro ao comunicar com o Banco Inter (HTTP ${statusCode})`
}

export function mapInterNetworkError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Falha ao conectar com o Banco Inter'
  }

  const message = error.message.toLowerCase()

  if (message.includes('timeout') || message.includes('tempo esgotado')) {
    return 'Tempo esgotado ao conectar com o Banco Inter'
  }

  if (
    message.includes('certificate') ||
    message.includes('cert') ||
    message.includes('key') ||
    message.includes('ssl') ||
    message.includes('tls') ||
    message.includes('handshake')
  ) {
    return 'Certificado ou chave privada inválidos. Confira se os arquivos .crt e .key correspondem à integração'
  }

  if (message.includes('econnrefused') || message.includes('enotfound')) {
    return 'Não foi possível alcançar os servidores do Banco Inter'
  }

  return error.message
}
