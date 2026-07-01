import { PrismaClient } from '@prisma/client'
import { decryptField } from '../../dist/common/crypto/field-encryption.js'
import { interMtlsRequest } from '../../dist/payments/providers/inter-pix-http.client.js'
import { normalizeInterPem, requestInterOAuthToken } from '../../dist/payments/providers/inter-pix.oauth.js'
import { INTER_BOLETO_OAUTH_SCOPES, INTER_PIX_BASE_URLS, INTER_PIX_REQUEST_TIMEOUT_MS } from '../../dist/payments/providers/inter-pix.constants.js'

const loteId = 'e3c5cf8e-4725-4411-b180-6a8a5b90d09f'
const prisma = new PrismaClient()

async function emitir(body, creds, token, baseUrl) {
  const payload = JSON.stringify(body)
  const response = await interMtlsRequest({
    method: 'POST',
    url: `${baseUrl}/cobranca/v3/cobrancas`,
    certificadoPem: normalizeInterPem(creds.certificadoPem),
    chavePrivadaPem: normalizeInterPem(creds.chavePrivadaPem),
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(payload)),
    },
    body: payload,
    timeoutMs: INTER_PIX_REQUEST_TIMEOUT_MS,
  })

  console.log('Status:', response.statusCode)
  console.log('Body:', response.rawBody)
  return response
}

try {
  const lote = await prisma.lote.findUnique({
    where: { id: loteId },
    include: { evento: true },
  })

  const gateway = await prisma.empresaGatewayPagamento.findUnique({
    where: { empresaId: lote.empresaId },
  })

  const creds = {
    clientId: decryptField(gateway.clientIdEnc).trim(),
    clientSecret: decryptField(gateway.clientSecretEnc).trim(),
    certificadoPem: decryptField(gateway.certificadoEnc),
    chavePrivadaPem: decryptField(gateway.chavePrivadaEnc),
    ambiente: gateway.ambiente,
  }

  const baseUrl = INTER_PIX_BASE_URLS[creds.ambiente]
  const token = await requestInterOAuthToken(
    baseUrl,
    creds,
    INTER_PIX_REQUEST_TIMEOUT_MS,
    INTER_BOLETO_OAUTH_SCOPES,
  )

  const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const pagadorBase = {
    cpfCnpj: '11953257704',
    tipoPessoa: 'FISICA',
    nome: 'testeleo2',
    email: 'teste2@teste2.com',
    cep: '01310100',
    endereco: 'Av Paulista',
    numero: '1000',
    bairro: 'Bela Vista',
    cidade: 'Sao Paulo',
    uf: 'SP',
    ddd: '11',
    telefone: '1111111111',
  }

  console.log('\n--- Teste 1: valor 10.00 ---')
  await emitir(
    {
      seuNumero: `T${Date.now()}`.slice(0, 15),
      valorNominal: 10,
      dataVencimento: vencimento,
      numDiasAgenda: 60,
      pagador: pagadorBase,
    },
    creds,
    token.access_token,
    baseUrl,
  )

  console.log('\n--- Teste 2: valor 1.00 endereco completo ---')
  await emitir(
    {
      seuNumero: `T${Date.now() + 1}`.slice(0, 15),
      valorNominal: 1,
      dataVencimento: vencimento,
      numDiasAgenda: 60,
      pagador: pagadorBase,
    },
    creds,
    token.access_token,
    baseUrl,
  )

  console.log('\nEvento:', {
    cidade: lote.evento.cidade,
    estado: lote.evento.estado,
    nome: lote.evento.nome,
  })
} finally {
  await prisma.$disconnect()
}
