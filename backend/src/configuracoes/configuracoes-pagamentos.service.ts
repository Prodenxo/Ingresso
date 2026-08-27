import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  decryptField,
  encryptField,
  maskSecret,
} from '../common/crypto/field-encryption'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PaymentProviderFactory } from '../payments/payment-provider.factory'
import { InfinityPayProvider } from '../payments/providers/infinitypay.provider'
import { PrismaService } from '../prisma/prisma.service'
import { SalvarGatewayPagamentoDto } from './dto/salvar-gateway-pagamento.dto'
import type {
  GatewayAmbiente,
  GatewayPagamentoCredenciais,
  GatewayPagamentoResumo,
  GatewayProvider,
  GatewayStatus,
  TestarConexaoPagamentoResponse,
} from './gateway-pagamento.types'
import {
  isInfinityPayGatewayCredenciais,
} from './gateway-pagamento.types'

const PLACEHOLDER_SECRET = '-'

@Injectable()
export class ConfiguracoesPagamentosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
    private readonly paymentProviderFactory: PaymentProviderFactory,
    private readonly infinityPayProvider: InfinityPayProvider,
  ) {}

  async obterResumo(usuarioId: string): Promise<GatewayPagamentoResumo> {
    const empresaId = await this.empresaAccess.assertPagamentoConfigAccess(
      usuarioId,
    )

    const gateway = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId },
    })

    if (!gateway) {
      return this.resumoVazio()
    }

    const provider = gateway.provider as GatewayProvider
    const clientId = decryptField(gateway.clientIdEnc)
    const isInfinity = provider === 'infinitypay'

    return {
      configurado: true,
      provider,
      ambiente: gateway.ambiente as GatewayAmbiente,
      status: gateway.status as GatewayStatus,
      clientIdMascarado: isInfinity ? null : maskSecret(clientId),
      handleMascarado: isInfinity ? maskSecret(clientId) : null,
      temClientSecret: isInfinity ? false : Boolean(gateway.clientSecretEnc),
      temCertificado: isInfinity ? false : Boolean(gateway.certificadoEnc),
      temChavePrivada: isInfinity ? false : Boolean(gateway.chavePrivadaEnc),
      temWebhookSecret: Boolean(gateway.webhookSecretEnc),
      chavePix: isInfinity ? null : gateway.chavePix,
      conectadoEm: gateway.conectadoEm?.toISOString() ?? null,
      ultimoErro: gateway.ultimoErro,
      atualizadoEm: gateway.updatedAt.toISOString(),
    }
  }

  async salvar(
    usuarioId: string,
    dto: SalvarGatewayPagamentoDto,
  ): Promise<GatewayPagamentoResumo> {
    const empresaId = await this.empresaAccess.assertPagamentoConfigAccess(
      usuarioId,
    )

    if (dto.provider === 'infinitypay') {
      return this.salvarInfinityPay(empresaId, usuarioId, dto)
    }

    return this.salvarInterPix(empresaId, usuarioId, dto)
  }

  async remover(usuarioId: string): Promise<{ message: string }> {
    const empresaId = await this.empresaAccess.assertPagamentoConfigAccess(
      usuarioId,
    )

    const gateway = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId },
    })

    if (!gateway) {
      throw new NotFoundException('Nenhuma configuração de pagamento encontrada')
    }

    await this.prisma.$transaction([
      this.prisma.empresaGatewayPagamento.delete({
        where: { empresaId },
      }),
      this.prisma.empresa.update({
        where: { id: empresaId },
        data: { gatewayPagamento: null },
      }),
    ])

    return { message: 'Configuração de pagamento removida' }
  }

  async testarConexao(usuarioId: string): Promise<TestarConexaoPagamentoResponse> {
    const empresaId = await this.empresaAccess.assertPagamentoConfigAccess(
      usuarioId,
    )

    const gateway = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId },
    })

    if (!gateway) {
      throw new BadRequestException(
        'Configure o gateway de pagamento antes de testar a conexão',
      )
    }

    const creds = await this.obterCredenciaisDescriptografadas(empresaId)

    const result = isInfinityPayGatewayCredenciais(creds)
      ? await this.infinityPayProvider.testConnection(creds, empresaId)
      : await this.paymentProviderFactory
          .get('inter-pix')
          .testConnection(creds)

    await this.prisma.empresaGatewayPagamento.update({
      where: { empresaId },
      data: result.ok
        ? {
            status: result.pixHabilitado ? 'conectado' : 'pendente',
            conectadoEm: result.pixHabilitado ? new Date() : null,
            ultimoErro: result.pixHabilitado
              ? null
              : (result.message ?? 'Conexão parcial'),
          }
        : {
            status: 'erro',
            ultimoErro: result.message ?? 'Falha ao testar conexão',
          },
    })

    const resumo = await this.obterResumo(usuarioId)

    return {
      ...resumo,
      testeOk: result.ok,
      testeMensagem: result.message ?? null,
      pixHabilitado: result.pixHabilitado ?? false,
    }
  }

  async obterCredenciaisDescriptografadas(
    empresaId: string,
  ): Promise<GatewayPagamentoCredenciais> {
    const gateway = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId },
    })

    if (!gateway) {
      throw new NotFoundException('Gateway de pagamento não configurado')
    }

    const provider = gateway.provider as GatewayProvider

    if (provider === 'infinitypay') {
      return {
        provider: 'infinitypay',
        ambiente: gateway.ambiente as GatewayAmbiente,
        handle: decryptField(gateway.clientIdEnc).trim(),
      }
    }

    return {
      provider: 'inter-pix',
      ambiente: gateway.ambiente as GatewayAmbiente,
      clientId: decryptField(gateway.clientIdEnc).trim(),
      clientSecret: decryptField(gateway.clientSecretEnc).trim(),
      certificadoPem: decryptField(gateway.certificadoEnc),
      chavePrivadaPem: decryptField(gateway.chavePrivadaEnc),
      webhookSecret: gateway.webhookSecretEnc
        ? decryptField(gateway.webhookSecretEnc)
        : null,
      chavePix: gateway.chavePix,
    }
  }

  private async salvarInfinityPay(
    empresaId: string,
    usuarioId: string,
    dto: SalvarGatewayPagamentoDto,
  ): Promise<GatewayPagamentoResumo> {
    const existente = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId },
    })

    const handle = dto.clientId?.trim().replace(/^\$+/, '')

    if (!handle && !existente?.clientIdEnc) {
      throw new BadRequestException('InfiniteTag (handle) é obrigatório')
    }

    const handleFinal =
      handle ??
      decryptField(existente!.clientIdEnc).trim().replace(/^\$+/, '')

    const placeholderEnc = encryptField(PLACEHOLDER_SECRET)
    const ambiente = dto.ambiente ?? 'producao'

    const data = {
      provider: 'infinitypay' as const,
      ambiente,
      clientIdEnc: encryptField(handleFinal),
      clientSecretEnc: placeholderEnc,
      certificadoEnc: placeholderEnc,
      chavePrivadaEnc: placeholderEnc,
      webhookSecretEnc: null,
      chavePix: null,
      status: 'pendente',
      ultimoErro: null,
      conectadoEm: null,
    }

    await this.persistirGateway(empresaId, 'infinitypay', data)

    return this.obterResumo(usuarioId)
  }

  private async salvarInterPix(
    empresaId: string,
    usuarioId: string,
    dto: SalvarGatewayPagamentoDto,
  ): Promise<GatewayPagamentoResumo> {
    const existente = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId },
    })

    if (!dto.ambiente) {
      throw new BadRequestException('Ambiente é obrigatório para Banco Inter')
    }

    if (dto.clientId?.trim() && existente?.clientIdEnc && !dto.clientSecret?.trim()) {
      const clientIdAtual = decryptField(existente.clientIdEnc)

      if (dto.clientId.trim() !== clientIdAtual) {
        throw new BadRequestException(
          'Ao alterar o Client ID, informe o Client Secret novamente',
        )
      }
    }

    const clientId = this.resolveTextField(
      dto.clientId,
      existente?.clientIdEnc,
      'Client ID',
    )
    const clientSecret = this.resolveSecretField(
      dto.clientSecret,
      existente?.clientSecretEnc,
      'Client Secret',
    )
    const certificadoPem = this.resolveTextField(
      dto.certificadoPem,
      existente?.certificadoEnc,
      'Certificado',
    )
    const chavePrivadaPem = this.resolveSecretField(
      dto.chavePrivadaPem,
      existente?.chavePrivadaEnc,
      'Chave privada',
    )

    const webhookSecret = dto.webhookSecret?.trim()
      ? dto.webhookSecret.trim()
      : existente?.webhookSecretEnc
        ? decryptField(existente.webhookSecretEnc)
        : null

    const data = {
      provider: 'inter-pix' as const,
      ambiente: dto.ambiente,
      clientIdEnc: encryptField(clientId),
      clientSecretEnc: encryptField(clientSecret),
      certificadoEnc: encryptField(this.normalizePem(certificadoPem)),
      chavePrivadaEnc: encryptField(this.normalizePem(chavePrivadaPem)),
      webhookSecretEnc: webhookSecret ? encryptField(webhookSecret) : null,
      chavePix: dto.chavePix?.trim() || null,
      status: 'pendente',
      ultimoErro: null,
      conectadoEm: null,
    }

    await this.persistirGateway(empresaId, 'inter-pix', data)

    return this.obterResumo(usuarioId)
  }

  private async persistirGateway(
    empresaId: string,
    provider: GatewayProvider,
    data: {
      provider: string
      ambiente: string
      clientIdEnc: string
      clientSecretEnc: string
      certificadoEnc: string
      chavePrivadaEnc: string
      webhookSecretEnc: string | null
      chavePix: string | null
      status: string
      ultimoErro: string | null
      conectadoEm: Date | null
    },
  ) {
    await this.prisma.$transaction([
      this.prisma.empresaGatewayPagamento.upsert({
        where: { empresaId },
        create: {
          empresaId,
          ...data,
        },
        update: data,
      }),
      this.prisma.empresa.update({
        where: { id: empresaId },
        data: { gatewayPagamento: provider },
      }),
    ])
  }

  private resumoVazio(): GatewayPagamentoResumo {
    return {
      configurado: false,
      provider: null,
      ambiente: null,
      status: null,
      clientIdMascarado: null,
      handleMascarado: null,
      temClientSecret: false,
      temCertificado: false,
      temChavePrivada: false,
      temWebhookSecret: false,
      chavePix: null,
      conectadoEm: null,
      ultimoErro: null,
      atualizadoEm: null,
    }
  }

  private resolveTextField(
    incoming: string | undefined,
    storedEnc: string | undefined,
    label: string,
  ): string {
    if (incoming?.trim()) {
      return incoming.trim()
    }

    if (storedEnc) {
      return decryptField(storedEnc)
    }

    throw new BadRequestException(`${label} é obrigatório na primeira configuração`)
  }

  private resolveSecretField(
    incoming: string | undefined,
    storedEnc: string | undefined,
    label: string,
  ): string {
    if (incoming?.trim()) {
      return incoming.trim()
    }

    if (storedEnc) {
      return decryptField(storedEnc)
    }

    throw new BadRequestException(`${label} é obrigatório na primeira configuração`)
  }

  private normalizePem(value: string): string {
    return value.replace(/\r\n/g, '\n').trim()
  }
}
