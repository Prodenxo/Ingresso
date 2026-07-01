import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  MetodoPagamento,
  Prisma,
  StatusIngresso,
  StatusLote,
  StatusPagamento,
  StatusPedido,
  StatusEvento,
  StatusWebhook,
  type EmpresaGatewayPagamento,
} from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import { hashPassword } from '../common/crypto/password'
import { ConfiguracoesPagamentosService } from '../configuracoes/configuracoes-pagamentos.service'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PaymentProviderFactory } from '../payments/payment-provider.factory'
import { InterBoletoProvider } from '../payments/providers/inter-boleto.provider'
import { INTER_BOLETO_VALOR_MINIMO } from '../payments/providers/inter-boleto.helpers'
import { InterPixProvider } from '../payments/providers/inter-pix.provider'
import { PrismaService } from '../prisma/prisma.service'
import { CheckoutDto } from './dto/checkout.dto'
import { ParticipanteAdicionalDto } from './dto/participante-adicional.dto'
import type { ParticipanteIngressoRegistro } from './types/participante-ingresso.type'
import {
  isValidCpf,
  isValidTelefone,
  normalizeCpf,
  normalizeTelefone,
} from '../common/utils/cpf'

function gerarCodigoPedido(): string {
  return `PED-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`
}

function gerarTokenIngresso(): string {
  return randomBytes(16).toString('hex')
}

async function hashToken(token: string): Promise<string> {
  return hashPassword(token)
}

function isMockPixEnabled(): boolean {
  return process.env.MOCK_PIX === 'true'
}

function isMockBoletoEnabled(): boolean {
  return process.env.MOCK_BOLETO === 'true'
}

function isInterGatewayConfigured(
  gatewayConfig: EmpresaGatewayPagamento | null,
): boolean {
  if (!gatewayConfig || gatewayConfig.provider !== 'inter-pix') {
    return false
  }

  return (
    Boolean(gatewayConfig.clientIdEnc) &&
    Boolean(gatewayConfig.clientSecretEnc) &&
    Boolean(gatewayConfig.certificadoEnc) &&
    Boolean(gatewayConfig.chavePrivadaEnc)
  )
}

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracoesPagamentos: ConfiguracoesPagamentosService,
    private readonly paymentProviderFactory: PaymentProviderFactory,
    private readonly interPixProvider: InterPixProvider,
    private readonly interBoletoProvider: InterBoletoProvider,
    private readonly empresaAccess: EmpresaAccessService,
  ) {}

  async checkoutLote(
    loteId: string,
    usuarioId: string,
    dto: CheckoutDto,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nome: true, email: true, telefone: true },
    })

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const lote = await this.prisma.lote.findUnique({
      where: { id: loteId },
      include: {
        evento: true,
      },
    })

    if (!lote?.evento) {
      throw new NotFoundException('Lote não encontrado')
    }

    await this.empresaAccess.assertVinculoEmpresa(usuarioId, lote.empresaId)

    if (lote.evento.status !== StatusEvento.PUBLICADO) {
      throw new BadRequestException('Evento não está publicado')
    }

    const now = new Date()

    if (
      lote.status !== StatusLote.ATIVO ||
      lote.vendaInicio > now ||
      lote.vendaFim < now
    ) {
      throw new BadRequestException('Lote indisponível para venda')
    }

    const disponiveis = lote.quantidade - lote.quantidadeVendida

    if (dto.quantidade > disponiveis) {
      throw new BadRequestException('Quantidade indisponível')
    }

    if (dto.quantidade > lote.limitePorCompra) {
      throw new BadRequestException(
        `Limite de ${lote.limitePorCompra} ingresso(s) por compra`,
      )
    }

    const metodo = dto.metodo ?? 'PIX'

    if (metodo === 'BOLETO') {
      const cpf = normalizeCpf(dto.compradorCpf ?? '')

      if (!isValidCpf(cpf)) {
        throw new BadRequestException('CPF do comprador é obrigatório e deve ser válido para boleto')
      }

      const subtotalBoleto = Number(lote.preco) * dto.quantidade

      if (subtotalBoleto < INTER_BOLETO_VALOR_MINIMO) {
        throw new BadRequestException(
          `Valor mínimo para boleto é R$ ${INTER_BOLETO_VALOR_MINIMO.toFixed(2).replace('.', ',')}`,
        )
      }
    }

    this.validarParticipantesCheckout(dto.quantidade, dto.participantesAdicionais)
    const participantesIngresso = this.montarParticipantesIngresso(
      usuario,
      dto.quantidade,
      dto.participantesAdicionais,
    )

    const precoUnitario = Number(lote.preco)
    const subtotal = precoUnitario * dto.quantidade
    const codigo = gerarCodigoPedido()
    const expiraEm =
      metodo === 'BOLETO'
        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 60 * 1000)

    const gatewayConfig = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId: lote.empresaId },
    })

    const interConfigurado = isInterGatewayConfigured(gatewayConfig)
    const usarInterPixReal = !isMockPixEnabled() && interConfigurado
    const usarInterBoletoReal = !isMockBoletoEnabled() && interConfigurado

    if (metodo === 'BOLETO' && !usarInterBoletoReal && !isMockBoletoEnabled()) {
      throw new BadRequestException(
        'Configure o Banco Inter em Configurações → Pagamentos para emitir boleto.',
      )
    }

    const usarGatewayReal =
      metodo === 'BOLETO' ? usarInterBoletoReal : usarInterPixReal

    const gateway =
      metodo === 'BOLETO'
        ? usarInterBoletoReal
          ? 'inter-boleto'
          : 'mock-boleto'
        : usarInterPixReal
          ? 'inter-pix'
          : 'mock-pix'

    const compradorCpf =
      metodo === 'BOLETO' ? normalizeCpf(dto.compradorCpf ?? '') : null

    const pedido = await this.prisma.pedido.create({
      data: {
        empresaId: lote.empresaId,
        eventoId: lote.eventoId,
        codigo,
        status: StatusPedido.PENDENTE,
        total: subtotal,
        compradorNome: usuario.nome,
        compradorEmail: usuario.email,
        compradorCpf,
        compradorTelefone: usuario.telefone,
        participantesIngresso: participantesIngresso as unknown as Prisma.InputJsonValue,
        expiraEm,
        itens: {
          create: {
            empresaId: lote.empresaId,
            loteId: lote.id,
            quantidade: dto.quantidade,
            precoUnitario,
            subtotal,
          },
        },
        pagamentos: {
          create: {
            empresaId: lote.empresaId,
            metodo:
              metodo === 'BOLETO'
                ? MetodoPagamento.BOLETO
                : MetodoPagamento.PIX,
            status: StatusPagamento.PENDENTE,
            valor: subtotal,
            gateway,
            gatewayRef: usarGatewayReal ? null : `${metodo}-${codigo}`,
          },
        },
      },
      include: {
        pagamentos: true,
        evento: { select: { nome: true, cidade: true, estado: true } },
      },
    })

    if (metodo === 'BOLETO') {
      return this.finalizarCheckoutBoleto({
        pedido,
        subtotal,
        gateway,
        usarInterReal: usarInterBoletoReal,
        loteEmpresaId: lote.empresaId,
        expiraEm,
      })
    }

    return this.finalizarCheckoutPix({
      pedido,
      subtotal,
      codigo,
      gateway,
      usarInterReal: usarInterPixReal,
      loteEmpresaId: lote.empresaId,
      expiraEm,
    })
  }

  private async finalizarCheckoutPix(input: {
    pedido: {
      id: string
      codigo: string
      total: unknown
      status: StatusPedido
      expiraEm: Date | null
      pagamentos: Array<{ id: string }>
      evento: { nome: string }
    }
    subtotal: number
    codigo: string
    gateway: string
    usarInterReal: boolean
    loteEmpresaId: string
    expiraEm: Date
  }) {
    const { pedido, subtotal, codigo, gateway, usarInterReal, loteEmpresaId, expiraEm } =
      input

    let pixCopiaCola: string

    if (usarInterReal) {
      const creds =
        await this.configuracoesPagamentos.obterCredenciaisDescriptografadas(
          loteEmpresaId,
        )
      const provider = this.paymentProviderFactory.get('inter-pix')
      const charge = await provider.createPixCharge({
        creds,
        pedidoId: pedido.id,
        valor: subtotal,
        pedidoCodigo: codigo,
        descricao: `Ingresso · ${pedido.evento.nome}`,
        expiraEm,
      })

      pixCopiaCola = charge.pixCopiaCola

      await this.prisma.pagamento.update({
        where: { id: pedido.pagamentos[0]!.id },
        data: {
          gatewayRef: charge.txid,
          gatewayPayload: {
            location: charge.location ?? null,
            txid: charge.txid,
          },
        },
      })
    } else {
      pixCopiaCola = `00020126580014BR.GOV.BCB.PIX0136${pedido.codigo}5204000053039865802BR5925EventHub6009SAO PAULO62070503***6304ABCD`
    }

    return {
      pedidoId: pedido.id,
      codigo: pedido.codigo,
      total: Number(pedido.total),
      status: pedido.status,
      metodo: 'PIX' as const,
      pagamentoId: pedido.pagamentos[0]?.id,
      gateway,
      pixCopiaCola,
      expiraEm: pedido.expiraEm,
    }
  }

  private async finalizarCheckoutBoleto(input: {
    pedido: {
      id: string
      codigo: string
      total: unknown
      status: StatusPedido
      expiraEm: Date | null
      compradorNome: string
      compradorEmail: string
      compradorCpf: string | null
      compradorTelefone: string | null
      pagamentos: Array<{ id: string }>
      evento: { nome: string; cidade: string | null; estado: string | null }
    }
    subtotal: number
    gateway: string
    usarInterReal: boolean
    loteEmpresaId: string
    expiraEm: Date
  }) {
    const {
      pedido,
      subtotal,
      gateway,
      usarInterReal,
      loteEmpresaId,
      expiraEm,
    } = input

    let linhaDigitavel: string
    let codigoBarras: string | null = null
    let dataVencimento: string
    let codigoSolicitacao: string | null = null

    if (usarInterReal) {
      const creds =
        await this.configuracoesPagamentos.obterCredenciaisDescriptografadas(
          loteEmpresaId,
        )
      const charge = await this.interBoletoProvider.createBoletoCharge({
        creds,
        pedidoCodigo: pedido.codigo,
        valor: subtotal,
        vencimentoEm: expiraEm,
        pagadorNome: pedido.compradorNome,
        pagadorCpf: pedido.compradorCpf ?? '',
        pagadorEmail: pedido.compradorEmail,
        pagadorTelefone: pedido.compradorTelefone,
        cidade: pedido.evento.cidade,
        estado: pedido.evento.estado,
      })

      linhaDigitavel = charge.linhaDigitavel
      codigoBarras = charge.codigoBarras
      dataVencimento = charge.dataVencimento
      codigoSolicitacao = charge.codigoSolicitacao

      await this.prisma.pagamento.update({
        where: { id: pedido.pagamentos[0]!.id },
        data: {
          gatewayRef: charge.codigoSolicitacao,
          gatewayPayload: {
            codigoSolicitacao: charge.codigoSolicitacao,
            linhaDigitavel: charge.linhaDigitavel,
            codigoBarras: charge.codigoBarras,
            nossoNumero: charge.nossoNumero,
            dataVencimento: charge.dataVencimento,
          },
        },
      })
    } else {
      linhaDigitavel = `34191.79001 01043.510047 91020.150008 8 ${String(Math.round(subtotal * 100)).padStart(14, '0')}`
      codigoBarras = linhaDigitavel.replace(/\D/g, '')
      dataVencimento = expiraEm.toISOString().slice(0, 10)
    }

    return {
      pedidoId: pedido.id,
      codigo: pedido.codigo,
      total: Number(pedido.total),
      status: pedido.status,
      metodo: 'BOLETO' as const,
      pagamentoId: pedido.pagamentos[0]?.id,
      gateway,
      linhaDigitavel,
      codigoBarras,
      dataVencimento,
      boletoPdfUrl:
        gateway === 'inter-boleto' && codigoSolicitacao != null
          ? `/pedidos/${pedido.id}/boleto/pdf`
          : null,
      expiraEm: pedido.expiraEm,
    }
  }

  async obterPdfBoleto(pedidoId: string, usuarioId: string): Promise<Buffer> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { email: true },
    })

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        compradorEmail: usuario.email,
      },
      include: { pagamentos: true },
    })

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado')
    }

    const pagamento = pedido.pagamentos[0]

    if (pagamento?.gateway !== 'inter-boleto' || !pagamento.gatewayRef) {
      throw new BadRequestException('PDF do boleto indisponível para este pedido')
    }

    const creds =
      await this.configuracoesPagamentos.obterCredenciaisDescriptografadas(
        pedido.empresaId,
      )

    return this.interBoletoProvider.getBoletoPdf(creds, pagamento.gatewayRef)
  }

  async obterStatusPedido(pedidoId: string, usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { email: true },
    })

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        compradorEmail: usuario.email,
      },
      include: {
        pagamentos: true,
        ingressos: {
          select: { id: true, qrCodeUrl: true, participanteNome: true },
        },
      },
    })

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado')
    }

    const pagamento = pedido.pagamentos[0]
    let status = pedido.status

    if (
      status === StatusPedido.PENDENTE &&
      pagamento?.gateway === 'inter-pix' &&
      pagamento.gatewayRef
    ) {
      const sincronizado = await this.sincronizarCobInterSePago(
        pedido.empresaId,
        pagamento.gatewayRef,
      )

      if (sincronizado) {
        const atualizado = await this.prisma.pedido.findUnique({
          where: { id: pedidoId },
          include: {
            pagamentos: true,
            ingressos: {
              select: { id: true, qrCodeUrl: true, participanteNome: true },
            },
          },
        })

        if (atualizado) {
          status = atualizado.status
          pedido.ingressos = atualizado.ingressos
        }
      }
    }

    if (
      status === StatusPedido.PENDENTE &&
      pagamento?.gateway === 'inter-boleto' &&
      pagamento.gatewayRef
    ) {
      const sincronizado = await this.sincronizarBoletoInterSePago(
        pedido.empresaId,
        pagamento.gatewayRef,
      )

      if (sincronizado) {
        const atualizado = await this.prisma.pedido.findUnique({
          where: { id: pedidoId },
          include: {
            pagamentos: true,
            ingressos: {
              select: { id: true, qrCodeUrl: true, participanteNome: true },
            },
          },
        })

        if (atualizado) {
          status = atualizado.status
          pedido.ingressos = atualizado.ingressos
        }
      }
    }

    const gatewayPayload = pagamento?.gatewayPayload as
      | Record<string, unknown>
      | null
      | undefined

    return {
      pedidoId: pedido.id,
      status,
      metodo: pagamento?.metodo ?? MetodoPagamento.PIX,
      gateway: pagamento?.gateway ?? 'mock-pix',
      expiraEm: pedido.expiraEm,
      linhaDigitavel:
        typeof gatewayPayload?.linhaDigitavel === 'string'
          ? gatewayPayload.linhaDigitavel
          : null,
      boletoPdfUrl:
        pagamento?.gateway === 'inter-boleto'
          ? `/pedidos/${pedido.id}/boleto/pdf`
          : null,
      ingressos:
        status === StatusPedido.PAGO
          ? pedido.ingressos.map((ingresso) => ({
              id: ingresso.id,
              codigo: ingresso.qrCodeUrl ?? ingresso.id,
              participanteNome: ingresso.participanteNome,
            }))
          : [],
    }
  }

  async confirmarPix(pedidoId: string, usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { email: true, nome: true },
    })

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const pedido = await this.prisma.pedido.findFirst({
      where: {
        id: pedidoId,
        compradorEmail: usuario.email,
      },
      include: { pagamentos: true },
    })

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado')
    }

    const gateway = pedido.pagamentos[0]?.gateway ?? 'mock-pix'

    if (gateway !== 'mock-pix' && gateway !== 'mock-boleto') {
      throw new BadRequestException(
        'Este pedido usa pagamento real. Aguarde a confirmação automática',
      )
    }

    return this.finalizarPedidoPago(pedidoId, usuario.nome, usuario.email)
  }

  async processarWebhookInterPix(empresaId: string, payload: unknown) {
    const webhook = await this.prisma.webhook.create({
      data: {
        empresaId,
        origem: 'inter-pix',
        evento: 'pix',
        payload: payload as object,
        status: StatusWebhook.PENDENTE,
      },
    })

    const pixItems = this.extrairPixDoWebhook(payload)

    try {
      for (const item of pixItems) {
        if (!item.txid) continue

        await this.processarPagamentoPorTxid(empresaId, item.txid)
      }

      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: {
          status: StatusWebhook.PROCESSADO,
          processadoEm: new Date(),
        },
      })
    } catch {
      await this.prisma.webhook.update({
        where: { id: webhook.id },
        data: { status: StatusWebhook.FALHA },
      })
      throw new BadRequestException('Falha ao processar webhook Pix')
    }

    return { received: true, processados: pixItems.length }
  }

  async processarPagamentoPorTxid(empresaId: string, txid: string) {
    const pagamento = await this.prisma.pagamento.findFirst({
      where: {
        empresaId,
        gateway: 'inter-pix',
        gatewayRef: txid,
      },
      include: {
        pedido: true,
      },
    })

    if (!pagamento) {
      return { processado: false, motivo: 'Pagamento não encontrado' }
    }

    if (pagamento.pedido.status === StatusPedido.PAGO) {
      return { processado: true, motivo: 'Pedido já pago' }
    }

    if (pagamento.pedido.status !== StatusPedido.PENDENTE) {
      return { processado: false, motivo: 'Pedido não está pendente' }
    }

    return this.finalizarPedidoPago(
      pagamento.pedidoId,
      pagamento.pedido.compradorNome,
      pagamento.pedido.compradorEmail,
    )
  }

  private async sincronizarBoletoInterSePago(
    empresaId: string,
    codigoSolicitacao: string,
  ): Promise<boolean> {
    try {
      const creds =
        await this.configuracoesPagamentos.obterCredenciaisDescriptografadas(
          empresaId,
        )
      const status = await this.interBoletoProvider.getBoletoStatus(
        creds,
        codigoSolicitacao,
      )

      if (!status.pago) {
        return false
      }

      await this.processarPagamentoPorCodigoSolicitacao(
        empresaId,
        codigoSolicitacao,
      )
      return true
    } catch {
      return false
    }
  }

  async processarPagamentoPorCodigoSolicitacao(
    empresaId: string,
    codigoSolicitacao: string,
  ) {
    const pagamento = await this.prisma.pagamento.findFirst({
      where: {
        empresaId,
        gateway: 'inter-boleto',
        gatewayRef: codigoSolicitacao,
      },
      include: {
        pedido: true,
      },
    })

    if (!pagamento) {
      return { processado: false, motivo: 'Pagamento não encontrado' }
    }

    if (pagamento.pedido.status === StatusPedido.PAGO) {
      return { processado: true, motivo: 'Pedido já pago' }
    }

    if (pagamento.pedido.status !== StatusPedido.PENDENTE) {
      return { processado: false, motivo: 'Pedido não está pendente' }
    }

    return this.finalizarPedidoPago(
      pagamento.pedidoId,
      pagamento.pedido.compradorNome,
      pagamento.pedido.compradorEmail,
    )
  }

  private async sincronizarCobInterSePago(
    empresaId: string,
    txid: string,
  ): Promise<boolean> {
    try {
      const creds =
        await this.configuracoesPagamentos.obterCredenciaisDescriptografadas(
          empresaId,
        )
      const cob = await this.interPixProvider.getChargeStatus(creds, txid)

      if (cob.status !== 'CONCLUIDA' && cob.status !== 'PAGA') {
        return false
      }

      await this.processarPagamentoPorTxid(empresaId, txid)
      return true
    } catch {
      return false
    }
  }

  private extrairPixDoWebhook(payload: unknown): Array<{ txid?: string }> {
    if (!payload || typeof payload !== 'object') {
      return []
    }

    const body = payload as { pix?: Array<{ txid?: string }> }

    if (Array.isArray(body.pix)) {
      return body.pix
    }

    const txid = (payload as { txid?: string }).txid

    if (txid) {
      return [{ txid }]
    }

    return []
  }

  private async finalizarPedidoPago(
    pedidoId: string,
    compradorNome: string,
    compradorEmail: string,
  ) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: {
          include: { lote: true },
        },
        pagamentos: true,
      },
    })

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado')
    }

    if (pedido.status === StatusPedido.PAGO) {
      const ingressos = await this.prisma.ingresso.findMany({
        where: { pedidoId },
        select: { id: true, qrCodeUrl: true, participanteNome: true },
      })

      return {
        pedidoId: pedido.id,
        status: StatusPedido.PAGO,
        ingressos: ingressos.map((ingresso) => ({
          id: ingresso.id,
          codigo: ingresso.qrCodeUrl ?? ingresso.id,
          participanteNome: ingresso.participanteNome,
        })),
      }
    }

    if (pedido.status !== StatusPedido.PENDENTE) {
      throw new BadRequestException('Pedido não pode ser confirmado')
    }

    const ingressosGerados: Array<{
      id: string
      codigo: string
      participanteNome: string
    }> = []

    const participantes = this.resolverParticipantesIngresso(pedido)
    let participanteIndex = 0

    await this.prisma.$transaction(async (tx) => {
      await tx.pedido.update({
        where: { id: pedido.id },
        data: { status: StatusPedido.PAGO },
      })

      await tx.pagamento.updateMany({
        where: { pedidoId: pedido.id },
        data: {
          status: StatusPagamento.APROVADO,
          pagoEm: new Date(),
        },
      })

      for (const item of pedido.itens) {
        const loteAtual = item.lote
        const disponiveis = loteAtual.quantidade - loteAtual.quantidadeVendida

        if (item.quantidade > disponiveis) {
          throw new BadRequestException('Ingressos esgotados durante confirmação')
        }

        await tx.lote.update({
          where: { id: item.loteId },
          data: {
            quantidadeVendida: { increment: item.quantidade },
            status:
              loteAtual.quantidadeVendida + item.quantidade >= loteAtual.quantidade
                ? StatusLote.ESGOTADO
                : StatusLote.ATIVO,
          },
        })

        for (let i = 0; i < item.quantidade; i += 1) {
          const participante =
            participantes[participanteIndex] ??
            ({
              nome: compradorNome,
              email: compradorEmail,
              telefone: pedido.compradorTelefone,
              cpf: pedido.compradorCpf,
              titular: participanteIndex === 0,
            } satisfies ParticipanteIngressoRegistro)

          participanteIndex += 1

          const token = gerarTokenIngresso()
          const tokenHash = await hashToken(token)
          const codigo = `EH-${createHash('sha256').update(token).digest('hex').slice(0, 12).toUpperCase()}`

          const ingresso = await tx.ingresso.create({
            data: {
              empresaId: pedido.empresaId,
              eventoId: pedido.eventoId,
              pedidoId: pedido.id,
              loteId: item.loteId,
              tokenHash,
              participanteNome: participante.nome,
              participanteEmail: participante.email ?? compradorEmail,
              participanteCpf: participante.cpf,
              participanteTelefone: participante.telefone,
              status: StatusIngresso.VALIDO,
              qrCodeUrl: codigo,
            },
          })

          ingressosGerados.push({
            id: ingresso.id,
            codigo,
            participanteNome: participante.nome,
          })
        }
      }
    })

    return {
      pedidoId: pedido.id,
      status: StatusPedido.PAGO,
      ingressos: ingressosGerados,
    }
  }

  private validarParticipantesCheckout(
    quantidade: number,
    adicionais?: ParticipanteAdicionalDto[],
  ) {
    if (quantidade <= 1) {
      if (adicionais && adicionais.length > 0) {
        throw new BadRequestException(
          'Participantes adicionais só são necessários ao comprar mais de 1 ingresso',
        )
      }

      return
    }

    const esperados = quantidade - 1

    if (!adicionais || adicionais.length !== esperados) {
      throw new BadRequestException(
        `Informe nome, CPF e celular de ${esperados} participante(s) adicional(is)`,
      )
    }

    for (const [index, participante] of adicionais.entries()) {
      if (!participante.nome.trim()) {
        throw new BadRequestException(
          `Nome do participante ${index + 2} é obrigatório`,
        )
      }

      if (!isValidCpf(participante.cpf)) {
        throw new BadRequestException(
          `CPF inválido do participante ${index + 2}`,
        )
      }

      if (!isValidTelefone(participante.telefone)) {
        throw new BadRequestException(
          `Celular inválido do participante ${index + 2}`,
        )
      }
    }
  }

  private montarParticipantesIngresso(
    usuario: { nome: string; email: string; telefone: string | null },
    quantidade: number,
    adicionais?: ParticipanteAdicionalDto[],
  ): ParticipanteIngressoRegistro[] {
    const titular: ParticipanteIngressoRegistro = {
      nome: usuario.nome.trim(),
      email: usuario.email,
      telefone: usuario.telefone,
      cpf: null,
      titular: true,
    }

    const extras =
      adicionais?.map((participante) => ({
        nome: participante.nome.trim(),
        email: null,
        cpf: normalizeCpf(participante.cpf),
        telefone: normalizeTelefone(participante.telefone),
        titular: false,
      })) ?? []

    const lista = [titular, ...extras]

    if (lista.length !== quantidade) {
      throw new BadRequestException('Quantidade de participantes inválida')
    }

    return lista
  }

  private resolverParticipantesIngresso(pedido: {
    participantesIngresso: unknown
    compradorNome: string
    compradorEmail: string
    compradorTelefone: string | null
    compradorCpf: string | null
    itens: Array<{ quantidade: number }>
  }): ParticipanteIngressoRegistro[] {
    if (Array.isArray(pedido.participantesIngresso)) {
      return pedido.participantesIngresso as ParticipanteIngressoRegistro[]
    }

    const totalIngressos = pedido.itens.reduce(
      (acc, item) => acc + item.quantidade,
      0,
    )

    return Array.from({ length: totalIngressos }, (_, index) => ({
      nome: pedido.compradorNome,
      email: pedido.compradorEmail,
      telefone: pedido.compradorTelefone,
      cpf: pedido.compradorCpf,
      titular: index === 0,
    }))
  }
}
