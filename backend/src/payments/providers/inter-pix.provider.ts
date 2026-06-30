import { Injectable, NotImplementedException } from '@nestjs/common'
import type { GatewayPagamentoCredenciais } from '../../configuracoes/gateway-pagamento.types'
import type {
  PaymentConnectionResult,
  PaymentProvider,
  PixChargeParams,
  PixChargeResult,
} from '../payment-provider.interface'
import {
  INTER_PIX_BASE_URLS,
  INTER_PIX_OAUTH_SCOPES,
  INTER_PIX_REQUEST_TIMEOUT_MS,
} from './inter-pix.constants'
import { mapInterHttpError, mapInterNetworkError } from './inter-pix.errors'
import { interMtlsRequest } from './inter-pix-http.client'

interface InterOAuthTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  scope?: string
}

@Injectable()
export class InterPixProvider implements PaymentProvider {
  async testConnection(
    creds: GatewayPagamentoCredenciais,
  ): Promise<PaymentConnectionResult> {
    try {
      const token = await this.obtainAccessToken(creds)

      if (!token.access_token) {
        return {
          ok: false,
          message: 'Resposta inválida do Banco Inter ao obter token',
        }
      }

      const ambienteLabel =
        creds.ambiente === 'producao' ? 'Produção' : 'Sandbox'

      return {
        ok: true,
        message: `Conexão validada com sucesso (${ambienteLabel})`,
      }
    } catch (error) {
      return {
        ok: false,
        message: mapInterNetworkError(error),
      }
    }
  }

  createPixCharge(_params: PixChargeParams): Promise<PixChargeResult> {
    throw new NotImplementedException(
      'Cobrança Pix real será implementada na Fase 4',
    )
  }

  async obtainAccessToken(
    creds: GatewayPagamentoCredenciais,
  ): Promise<InterOAuthTokenResponse> {
    const baseUrl = INTER_PIX_BASE_URLS[creds.ambiente]
    const body = new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      grant_type: 'client_credentials',
      scope: INTER_PIX_OAUTH_SCOPES,
    }).toString()

    const response = await interMtlsRequest<InterOAuthTokenResponse>({
      method: 'POST',
      url: `${baseUrl}/oauth/v2/token`,
      certificadoPem: creds.certificadoPem,
      chavePrivadaPem: creds.chavePrivadaPem,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': String(Buffer.byteLength(body)),
      },
      body,
      timeoutMs: INTER_PIX_REQUEST_TIMEOUT_MS,
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(
        mapInterHttpError(response.statusCode, response.data, response.rawBody),
      )
    }

    return response.data
  }
}
