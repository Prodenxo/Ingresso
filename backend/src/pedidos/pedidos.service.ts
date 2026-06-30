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
} from '@prisma/client'
import { createHash, randomBytes } from 'crypto'
import { hashPassword } from '../common/crypto/password'
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

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

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
        expiraEm: new Date(Date.now() + 30 * 60 * 1000),
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
            gateway: 'mock-pix',
            gatewayRef: `PIX-${codigo}`,
          },
        },
      },
      include: {
        pagamentos: true,
      },
    })

    return {
      pedidoId: pedido.id,
      codigo: pedido.codigo,
      total: Number(pedido.total),
      status: pedido.status,
      pagamentoId: pedido.pagamentos[0]?.id,
      pixCopiaCola: `00020126580014BR.GOV.BCB.PIX0136${pedido.codigo}5204000053039865802BR5925EventHub6009SAO PAULO62070503***6304ABCD`,
      expiraEm: pedido.expiraEm,
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
      return { message: 'Pedido já confirmado', pedidoId: pedido.id }
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
              participanteNome: usuario.nome,
              participanteEmail: usuario.email,
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
