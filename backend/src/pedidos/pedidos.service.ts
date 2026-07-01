import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  MetodoPagamento,
  StatusIngresso,
  StatusLote,
  StatusPagamento,
  StatusPedido,
  StatusEvento,
  StatusWebhook,
} from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import { hashPassword } from '../common/crypto/password'
import { ConfiguracoesPagamentosService } from '../configuracoes/configuracoes-pagamentos.service'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PaymentProviderFactory } from '../payments/payment-provider.factory'
import { InterPixProvider } from '../payments/providers/inter-pix.provider'
import { PrismaService } from '../prisma/prisma.service'
import { CheckoutDto } from './dto/checkout.dto'

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

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configuracoesPagamentos: ConfiguracoesPagamentosService,
    private readonly paymentProviderFactory: PaymentProviderFactory,
    private readonly interPixProvider: InterPixProvider,
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

    const precoUnitario = Number(lote.preco)
    const subtotal = precoUnitario * dto.quantidade
    const codigo = gerarCodigoPedido()
    const expiraEm = new Date(Date.now() + 30 * 60 * 1000)

    const gatewayConfig = await this.prisma.empresaGatewayPagamento.findUnique({
      where: { empresaId: lote.empresaId },
    })

    const usarInterPix =
      !isMockPixEnabled() &&
      gatewayConfig?.provider === 'inter-pix'

    const pedido = await this.prisma.pedido.create({
      data: {
        empresaId: lote.empresaId,
        eventoId: lote.eventoId,
        codigo,
        status: StatusPedido.PENDENTE,
        total: subtotal,
        compradorNome: usuario.nome,
        compradorEmail: usuario.email,
        compradorTelefone: usuario.telefone,
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
            metodo: MetodoPagamento.PIX,
            status: StatusPagamento.PENDENTE,
            valor: subtotal,
            gateway: usarInterPix ? 'inter-pix' : 'mock-pix',
            gatewayRef: usarInterPix ? null : `PIX-${codigo}`,
          },
        },
      },
      include: {
        pagamentos: true,
        evento: { select: { nome: true } },
      },
    })

    let pixCopiaCola: string
    let gateway = usarInterPix ? 'inter-pix' : 'mock-pix'

    if (usarInterPix) {
      const creds =
        await this.configuracoesPagamentos.obterCredenciaisDescriptografadas(
          lote.empresaId,
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
      pagamentoId: pedido.pagamentos[0]?.id,
      gateway,
      pixCopiaCola,
      expiraEm: pedido.expiraEm,
    }
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
          select: { id: true, qrCodeUrl: true },
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
            ingressos: { select: { id: true, qrCodeUrl: true } },
          },
        })

        if (atualizado) {
          status = atualizado.status
          pedido.ingressos = atualizado.ingressos
        }
      }
    }

    return {
      pedidoId: pedido.id,
      status,
      gateway: pagamento?.gateway ?? 'mock-pix',
      expiraEm: pedido.expiraEm,
      ingressos:
        status === StatusPedido.PAGO
          ? pedido.ingressos.map((ingresso) => ({
              id: ingresso.id,
              codigo: ingresso.qrCodeUrl ?? ingresso.id,
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

    if (gateway !== 'mock-pix') {
      throw new BadRequestException(
        'Este pedido usa Pix real. Aguarde a confirmação automática do pagamento',
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
        select: { id: true, qrCodeUrl: true },
      })

      return {
        pedidoId: pedido.id,
        status: StatusPedido.PAGO,
        ingressos: ingressos.map((ingresso) => ({
          id: ingresso.id,
          codigo: ingresso.qrCodeUrl ?? ingresso.id,
        })),
      }
    }

    if (pedido.status !== StatusPedido.PENDENTE) {
      throw new BadRequestException('Pedido não pode ser confirmado')
    }

    const ingressosGerados: Array<{ id: string; codigo: string }> = []

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
              participanteNome: compradorNome,
              participanteEmail: compradorEmail,
              status: StatusIngresso.VALIDO,
              qrCodeUrl: codigo,
            },
          })

          ingressosGerados.push({ id: ingresso.id, codigo })
        }
      }
    })

    return {
      pedidoId: pedido.id,
      status: StatusPedido.PAGO,
      ingressos: ingressosGerados,
    }
  }
}
