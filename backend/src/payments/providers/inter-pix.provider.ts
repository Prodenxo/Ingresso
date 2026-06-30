import {
  BadRequestException,
  Injectable,
} from '@nestjs/common'
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
import type {
  InterCobResponse,
  InterOAuthTokenResponse,
} from './inter-pix.types'
import { gerarTxidInter } from './inter-pix.utils'

interface CachedToken {
  accessToken: string
  expiresAt: number
}

@Injectable()
export class InterPixProvider implements PaymentProvider {
  private readonly tokenCache = new Map<string, CachedToken>()

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

  async createPixCharge(params: PixChargeParams): Promise<PixChargeResult> {
    if (!params.creds.chavePix?.trim()) {
      throw new BadRequestException(
        'Chave Pix não configurada. Cadastre em Configurações → Pagamentos',
      )
    }

    const txid = gerarTxidInter(params.pedidoId)
    const expiracaoSeg = Math.max(
      60,
      Math.floor((params.expiraEm.getTime() - Date.now()) / 1000),
    )
    const valorStr = params.valor.toFixed(2)
    const body = JSON.stringify({
      calendario: { expiracao: expiracaoSeg },
      valor: { original: valorStr },
      chave: params.creds.chavePix.trim(),
      solicitacaoPagador: params.descricao.slice(0, 140),
      infoAdicionais: [
        {
          nome: 'Pedido',
          valor: params.pedidoCodigo.slice(0, 50),
        },
      ],
    })

    const response = await this.authenticatedRequest<InterCobResponse>(
      params.creds,
      {
        method: 'PUT',
        path: `/pix/v2/cob/${txid}`,
        body,
      },
    )

    const pixCopiaCola = response.pixCopiaECola ?? response.pixCopiaCola

    if (!pixCopiaCola) {
      throw new BadRequestException(
        'Banco Inter não retornou o código Pix da cobrança',
      )
    }

    return {
      txid: response.txid ?? txid,
      pixCopiaCola,
      location: response.loc?.location ?? response.location,
    }
  }

  async getChargeStatus(
    creds: GatewayPagamentoCredenciais,
    txid: string,
  ): Promise<InterCobResponse> {
    return this.authenticatedRequest<InterCobResponse>(creds, {
      method: 'GET',
      path: `/pix/v2/cob/${txid}`,
    })
  }

  async obtainAccessToken(
    creds: GatewayPagamentoCredenciais,
  ): Promise<InterOAuthTokenResponse> {
    const cacheKey = `${creds.ambiente}:${creds.clientId}`
    const cached = this.tokenCache.get(cacheKey)

    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return { access_token: cached.accessToken, token_type: 'Bearer' }
    }

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

    if (response.data.access_token) {
      const expiresInMs = (response.data.expires_in ?? 3600) * 1000
      this.tokenCache.set(cacheKey, {
        accessToken: response.data.access_token,
        expiresAt: Date.now() + expiresInMs,
      })
    }

    return response.data
  }

  private async authenticatedRequest<T>(
    creds: GatewayPagamentoCredenciais,
    options: {
      method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE'
      path: string
      body?: string
    },
  ): Promise<T> {
    const token = await this.obtainAccessToken(creds)
    const accessToken = token.access_token

    if (!accessToken) {
      throw new BadRequestException('Não foi possível autenticar no Banco Inter')
    }

    const baseUrl = INTER_PIX_BASE_URLS[creds.ambiente]
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
    }

    if (options.body) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = String(Buffer.byteLength(options.body))
    }

    try {
      const response = await interMtlsRequest<T>({
        method: options.method,
        url: `${baseUrl}${options.path}`,
        certificadoPem: creds.certificadoPem,
        chavePrivadaPem: creds.chavePrivadaPem,
        headers,
        body: options.body,
        timeoutMs: INTER_PIX_REQUEST_TIMEOUT_MS,
      })

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw new BadRequestException(
          mapInterHttpError(response.statusCode, response.data, response.rawBody),
        )
      }

      return response.data
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException(mapInterNetworkError(error))
    }
  }
}
