import {
  buildInterOAuthRequest,
  normalizeInterPem,
  validateInterCredentials,
} from './inter-pix.oauth'
import type { GatewayPagamentoCredenciais } from '../../configuracoes/gateway-pagamento.types'

const baseCreds: GatewayPagamentoCredenciais = {
  provider: 'inter-pix',
  ambiente: 'producao',
  clientId: 'client-id',
  clientSecret: 'client-secret',
  certificadoPem: '-----BEGIN CERTIFICATE-----\nabc\n-----END CERTIFICATE-----',
  chavePrivadaPem: '-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----',
  webhookSecret: null,
  chavePix: null,
}

describe('inter-pix.oauth', () => {
  it('normaliza quebras de linha do PEM', () => {
    expect(normalizeInterPem('a\r\nb\r\n')).toBe('a\nb')
  })

  it('valida credenciais completas', () => {
    expect(validateInterCredentials(baseCreds)).toBeNull()
  })

  it('detecta client secret ausente', () => {
    expect(
      validateInterCredentials({ ...baseCreds, clientSecret: '   ' }),
    ).toContain('Client Secret')
  })

  it('monta OAuth com client_id no body', () => {
    const request = buildInterOAuthRequest(
      'id',
      'secret',
      'cob.read cob.write',
      'form-body',
    )

    expect(request.body).toContain('client_id=id')
    expect(request.body).toContain('client_secret=secret')
    expect(request.headers.Authorization).toBeUndefined()
  })

  it('monta OAuth com Authorization Basic', () => {
    const request = buildInterOAuthRequest(
      'id',
      'secret',
      'cob.read cob.write',
      'basic-auth',
    )

    expect(request.body).not.toContain('client_secret')
    expect(request.headers.Authorization).toBe(
      `Basic ${Buffer.from('id:secret', 'utf8').toString('base64')}`,
    )
  })
})
