import { BadRequestException, Injectable } from '@nestjs/common'
import type { GatewayPagamentoCredenciais } from '../../configuracoes/gateway-pagamento.types'
import {
  INTER_BOLETO_OAUTH_SCOPES,
  INTER_PIX_BASE_URLS,
  INTER_PIX_REQUEST_TIMEOUT_MS,
} from './inter-pix.constants'
import { mapInterHttpError, mapInterNetworkError } from './inter-pix.errors'
import { interMtlsRequest } from './inter-pix-http.client'
import { normalizeInterPem, requestInterOAuthToken } from './inter-pix.oauth'
import type {
  InterConsultarCobrancaResponse,
  InterCobrancaDetalhe,
  InterEmitirCobrancaRequest,
  InterEmitirCobrancaResponse,
} from './inter-boleto.types'
import { INTER_BOLETO_SITUACOES_PAGAS } from './inter-boleto.types'
import {
  decodeInterPdfResponse,
  formatInterPagadorTelefone,
  INTER_BOLETO_VALOR_MINIMO,
  normalizeInterCidade,
  normalizeInterUf,
} from './inter-boleto.helpers'

export interface BoletoChargeParams {
  creds: GatewayPagamentoCredenciais
  pedidoCodigo: string
  valor: number
  vencimentoEm: Date
  pagadorNome: string
  pagadorCpf: string
  pagadorEmail: string
  pagadorTelefone?: string | null
  cidade?: string | null
  estado?: string | null
}

export interface BoletoChargeResult {
  codigoSolicitacao: string
  linhaDigitavel: string
  codigoBarras: string | null
  nossoNumero: string | null
  dataVencimento: string
}

function formatDateBr(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

interface CachedInterToken {
  accessToken: string
  expiresAt: number
}

@Injectable()
export class InterBoletoProvider {
  private readonly tokenCache = new Map<string, CachedInterToken>()
  async createBoletoCharge(
    params: BoletoChargeParams,
  ): Promise<BoletoChargeResult> {
    const cpf = params.pagadorCpf.replace(/\D/g, '')

    if (cpf.length !== 11) {
      throw new BadRequestException('CPF do pagador inválido para boleto')
    }

    if (params.valor < INTER_BOLETO_VALOR_MINIMO) {
      throw new BadRequestException(
        `Valor mínimo para boleto é R$ ${INTER_BOLETO_VALOR_MINIMO.toFixed(2).replace('.', ',')}`,
      )
    }

    const uf = normalizeInterUf(params.estado)
    const cidade = normalizeInterCidade(params.cidade, uf)
    const contato = formatInterPagadorTelefone(params.pagadorTelefone)

    const body: InterEmitirCobrancaRequest = {
      seuNumero: params.pedidoCodigo.replace(/[^a-zA-Z0-9]/g, '').slice(0, 15),
      valorNominal: Number(params.valor.toFixed(2)),
      dataVencimento: formatDateBr(params.vencimentoEm),
      numDiasAgenda: 60,
      pagador: {
        cpfCnpj: cpf,
        tipoPessoa: 'FISICA',
        nome: params.pagadorNome.slice(0, 100),
        email: params.pagadorEmail.slice(0, 100),
        cep: '01310100',
        endereco: 'Nao informado',
        numero: 'S/N',
        bairro: 'Centro',
        cidade,
        uf,
        ...(contato.ddd ? { ddd: contato.ddd } : {}),
        ...(contato.telefone ? { telefone: contato.telefone } : {}),
      },
    }

    const accessToken = await this.obtainAccessToken(params.creds)

    const emitResponse = await this.authenticatedRequest<
      InterEmitirCobrancaResponse
    >(params.creds, accessToken, {
      method: 'POST',
      path: '/cobranca/v3/cobrancas',
      body: JSON.stringify(body),
    })

    const codigoSolicitacao = emitResponse.codigoSolicitacao

    if (!codigoSolicitacao) {
      throw new BadRequestException(
        'Banco Inter não retornou o código da cobrança',
      )
    }

    const detalhe = await this.aguardarDetalhesBoleto(
      params.creds,
      codigoSolicitacao,
      accessToken,
    )

    const linhaDigitavel = detalhe?.boleto?.linhaDigitavel ?? ''

    return {
      codigoSolicitacao,
      linhaDigitavel,
      codigoBarras: detalhe?.boleto?.codigoBarras ?? null,
      nossoNumero: detalhe?.boleto?.nossoNumero ?? null,
      dataVencimento: detalhe?.dataVencimento ?? body.dataVencimento,
    }
  }

  async getBoletoStatus(
    creds: GatewayPagamentoCredenciais,
    codigoSolicitacao: string,
  ): Promise<{ situacao: string; pago: boolean }> {
    const accessToken = await this.obtainAccessToken(creds)
    const response = await this.authenticatedRequest<InterConsultarCobrancaResponse>(
      creds,
      accessToken,
      {
        method: 'GET',
        path: `/cobranca/v3/cobrancas/${codigoSolicitacao}`,
      },
    )

    const situacao = response.cobranca?.situacao ?? 'DESCONHECIDA'

    return {
      situacao,
      pago: INTER_BOLETO_SITUACOES_PAGAS.includes(
        situacao as (typeof INTER_BOLETO_SITUACOES_PAGAS)[number],
      ),
    }
  }

  async getBoletoPdf(
    creds: GatewayPagamentoCredenciais,
    codigoSolicitacao: string,
  ): Promise<Buffer> {
    const token = await this.obtainAccessToken(creds)
    const baseUrl = INTER_PIX_BASE_URLS[creds.ambiente]

    const response = await interMtlsRequest<unknown>({
      method: 'GET',
      url: `${baseUrl}/cobranca/v3/cobrancas/${codigoSolicitacao}/pdf`,
      certificadoPem: normalizeInterPem(creds.certificadoPem),
      chavePrivadaPem: normalizeInterPem(creds.chavePrivadaPem),
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      timeoutMs: INTER_PIX_REQUEST_TIMEOUT_MS,
    })

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new BadRequestException(
        mapInterHttpError(response.statusCode, response.data, response.rawBody),
      )
    }

    let pdfBuffer: Buffer

    try {
      pdfBuffer = decodeInterPdfResponse(response.rawBody, response.data)
    } catch {
      throw new BadRequestException('Resposta do Inter não contém PDF do boleto')
    }

    if (!pdfBuffer.subarray(0, 4).equals(Buffer.from('%PDF'))) {
      throw new BadRequestException('PDF do boleto inválido retornado pelo Inter')
    }

    return pdfBuffer
  }

  private async aguardarDetalhesBoleto(
    creds: GatewayPagamentoCredenciais,
    codigoSolicitacao: string,
    accessToken: string,
  ): Promise<InterCobrancaDetalhe | null> {
    for (let tentativa = 0; tentativa < 6; tentativa += 1) {
      try {
        const response = await this.authenticatedRequest<InterConsultarCobrancaResponse>(
          creds,
          accessToken,
          {
            method: 'GET',
            path: `/cobranca/v3/cobrancas/${codigoSolicitacao}`,
          },
        )

        if (response.cobranca?.boleto?.linhaDigitavel) {
          return response.cobranca
        }
      } catch (error) {
        const message =
          error instanceof BadRequestException
            ? String(error.message)
            : ''

        if (!message.includes('429') && !message.includes('Muitas requisições')) {
          throw error
        }

        await sleep(5000)
        continue
      }

      await sleep(2000)
    }

    return null
  }

  private async obtainAccessToken(
    creds: GatewayPagamentoCredenciais,
  ): Promise<string> {
    const cacheKey = `${creds.ambiente}:${creds.clientId}:boleto`
    const cached = this.tokenCache.get(cacheKey)

    if (cached && cached.expiresAt > Date.now() + 60_000) {
      return cached.accessToken
    }

    const token = await requestInterOAuthToken(
      INTER_PIX_BASE_URLS[creds.ambiente],
      creds,
      INTER_PIX_REQUEST_TIMEOUT_MS,
      INTER_BOLETO_OAUTH_SCOPES,
    )

    if (!token.access_token) {
      throw new BadRequestException('Não foi possível autenticar no Banco Inter')
    }

    const expiresInMs = (token.expires_in ?? 3600) * 1000
    this.tokenCache.set(cacheKey, {
      accessToken: token.access_token,
      expiresAt: Date.now() + expiresInMs,
    })

    return token.access_token
  }

  private async authenticatedRequest<T>(
    creds: GatewayPagamentoCredenciais,
    accessToken: string,
    options: {
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      path: string
      body?: string
    },
  ): Promise<T> {
    const baseUrl = INTER_PIX_BASE_URLS[creds.ambiente]
    const headers: Record<string, string> = {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    }

    if (options.body) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = String(Buffer.byteLength(options.body))
    }

    try {
      const response = await interMtlsRequest<T>({
        method: options.method,
        url: `${baseUrl}${options.path}`,
        certificadoPem: normalizeInterPem(creds.certificadoPem),
        chavePrivadaPem: normalizeInterPem(creds.chavePrivadaPem),
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
