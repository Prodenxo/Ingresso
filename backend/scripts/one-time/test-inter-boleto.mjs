import { PrismaClient } from '@prisma/client'
import { decryptField } from '../../dist/common/crypto/field-encryption.js'
import { InterBoletoProvider } from '../../dist/payments/providers/inter-boleto.provider.js'

const loteId = process.argv[2] ?? 'e3c5cf8e-4725-4411-b180-6a8a5b90d09f'
const prisma = new PrismaClient()
const provider = new InterBoletoProvider()

try {
  const lote = await prisma.lote.findUnique({
    where: { id: loteId },
    include: { evento: true },
  })

  if (!lote) {
    throw new Error(`Lote ${loteId} não encontrado`)
  }

  const gateway = await prisma.empresaGatewayPagamento.findUnique({
    where: { empresaId: lote.empresaId },
  })

  if (!gateway) {
    throw new Error('Gateway não configurado')
  }

  const creds = {
    provider: 'inter-pix',
    ambiente: gateway.ambiente,
    clientId: decryptField(gateway.clientIdEnc),
    clientSecret: decryptField(gateway.clientSecretEnc),
    certificadoPem: decryptField(gateway.certificadoEnc),
    chavePrivadaPem: decryptField(gateway.chavePrivadaEnc),
    chavePix: gateway.chavePix,
    webhookSecret: gateway.webhookSecretEnc
      ? decryptField(gateway.webhookSecretEnc)
      : null,
  }

  const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  console.log('Testando emissão boleto Inter...')
  console.log('Empresa:', lote.empresaId)
  console.log('Ambiente:', creds.ambiente)
  console.log('Valor:', Number(lote.preco))

  const result = await provider.createBoletoCharge({
    creds,
    pedidoCodigo: `TEST-${Date.now()}`,
    valor: 10,
    vencimentoEm: vencimento,
    pagadorNome: 'testeleo2',
    pagadorCpf: '11953257704',
    pagadorEmail: 'teste2@teste2.com',
    pagadorTelefone: '1111111111',
    cidade: lote.evento.cidade,
    estado: lote.evento.estado,
  })

  console.log('SUCESSO:', JSON.stringify(result, null, 2))
} catch (error) {
  console.error('ERRO:', error)
} finally {
  await prisma.$disconnect()
}
