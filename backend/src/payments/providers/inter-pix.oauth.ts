import { BadRequestException } from '@nestjs/common'
import type { GatewayPagamentoCredenciais } from '../../configuracoes/gateway-pagamento.types'
import { interMtlsRequest } from './inter-pix-http.client'
import { mapInterHttpError } from './inter-pix.errors'
import type { InterOAuthTokenResponse } from './inter-pix.types'

export type InterOAuthMode = 'form-body' | 'basic-auth' | 'mtls-only'

const OAUTH_MODES: InterOAuthMode[] = ['form-body', 'basic-auth', 'mtls-only']

export function normalizeInterPem(value: string): string {
  return value.replace(/\r\n/g, '\n').trim()
}

export function validateInterCredentials(
  creds: GatewayPagamentoCredenciais,
): string | null {
  if (!creds.clientId?.trim()) {
    return 'Client ID não foi salvo no servidor. Cole novamente e salve.'
  }

  if (!creds.clientSecret?.trim()) {
    return 'Client Secret não foi salvo no servidor. Cole novamente e salve.'
  }

  const certificado = normalizeInterPem(creds.certificadoPem)
  const chave = normalizeInterPem(creds.chavePrivadaPem)

  if (!certificado.includes('BEGIN CERTIFICATE')) {
    return 'Certificado inválido no servidor. Envie novamente o arquivo .crt da integração.'
  }

  if (!/BEGIN (?:RSA |EC )?PRIVATE KEY/.test(chave)) {
    return 'Chave privada inválida no servidor. Envie novamente o arquivo .key da integração.'
  }

  return null
}

export function buildInterOAuthRequest(
  clientId: string,
  clientSecret: string,
  scope: string,
  mode: InterOAuthMode,
): { body: string; headers: Record<string, string> } {
  const baseHeaders = {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  if (mode === 'form-body') {
    const params: Record<string, string> = {
      grant_type: 'client_credentials',
    }

    if (scope.trim()) {
      params.scope = scope
    }

    if (clientId) {
      params.client_id = clientId
    }

    if (clientSecret) {
      params.client_secret = clientSecret
    }

    const body = new URLSearchParams(params).toString()

    return {
      body,
      headers: {
        ...baseHeaders,
        'Content-Length': String(Buffer.byteLength(body)),
      },
    }
  }

  const params: Record<string, string> = {
    grant_type: 'client_credentials',
  }

  if (scope.trim()) {
    params.scope = scope
  }

  const body = new URLSearchParams(params).toString()

  const headers: Record<string, string> = {
    ...baseHeaders,
    'Content-Length': String(Buffer.byteLength(body)),
  }

  if (mode === 'basic-auth') {
    headers.Authorization = `Basic ${Buffer.from(`${clientId}:${clientSecret}`, 'utf8').toString('base64')}`
  }

  return { body, headers }
}

export async function requestInterOAuthToken(
  baseUrl: string,
  creds: GatewayPagamentoCredenciais,
  timeoutMs: number,
  scope: string,
): Promise<InterOAuthTokenResponse> {
  const clientId = creds.clientId.trim()
  const clientSecret = creds.clientSecret.trim()
  const certificadoPem = normalizeInterPem(creds.certificadoPem)
  const chavePrivadaPem = normalizeInterPem(creds.chavePrivadaPem)

  let lastError: Error | null = null

  for (const mode of OAUTH_MODES) {
    const { body, headers } = buildInterOAuthRequest(
      clientId,
      clientSecret,
      scope,
      mode,
    )

    const response = await interMtlsRequest<InterOAuthTokenResponse>({
      method: 'POST',
      url: `${baseUrl}/oauth/v2/token`,
      certificadoPem,
      chavePrivadaPem,
      headers,
      body,
      timeoutMs,
    })

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return response.data
    }

    const message = mapInterHttpError(
      response.statusCode,
      response.data,
      response.rawBody,
    )

    lastError = new Error(message)

    if (response.statusCode !== 401 && response.statusCode !== 403) {
      throw new BadRequestException(message)
    }
  }

  throw new BadRequestException(
    lastError?.message ?? 'Falha ao autenticar no Banco Inter',
  )
}
