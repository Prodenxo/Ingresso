import { Injectable } from '@nestjs/common'
import { StatusEvento, StatusPedido } from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
  ) {}

  async getOverview(usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)

    const [
      eventosPublicados,
      eventosTotal,
      ingressosVendidos,
      lotesAgg,
      pedidosPendentes,
      pedidosRecentes,
    ] = await Promise.all([
      this.prisma.evento.count({
        where: { empresaId, status: StatusEvento.PUBLICADO },
      }),
      this.prisma.evento.count({ where: { empresaId } }),
      this.prisma.ingresso.count({ where: { empresaId } }),
      this.prisma.lote.aggregate({
        where: { empresaId },
        _sum: { quantidade: true, quantidadeVendida: true },
      }),
      this.prisma.pedido.count({
        where: { empresaId, status: StatusPedido.PENDENTE },
      }),
      this.prisma.pedido.findMany({
        where: { empresaId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          codigo: true,
          status: true,
          total: true,
          compradorNome: true,
          createdAt: true,
          evento: { select: { nome: true } },
        },
      }),
    ])

    const capacidadeTotal = lotesAgg._sum.quantidade ?? 0
    const vendidosLotes = lotesAgg._sum.quantidadeVendida ?? 0
    const ingressosDisponiveis = Math.max(0, capacidadeTotal - vendidosLotes)
    const taxaOcupacao =
      capacidadeTotal > 0
        ? Math.round((vendidosLotes / capacidadeTotal) * 100)
        : 0

    return {
      eventosPublicados,
      eventosTotal,
      ingressosVendidos,
      ingressosDisponiveis,
      pedidosPendentes,
      taxaOcupacao,
      pedidosRecentes: pedidosRecentes.map((pedido) => ({
        id: pedido.id,
        codigo: pedido.codigo,
        status: pedido.status,
        total: Number(pedido.total),
        compradorNome: pedido.compradorNome,
        eventoNome: pedido.evento.nome,
        createdAt: pedido.createdAt.toISOString(),
      })),
    }
  }

  async getFinanceiro(usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)

    const [receitaAgg, pedidosPagos, pedidosPendentes, pedidos] =
      await Promise.all([
        this.prisma.pedido.aggregate({
          where: { empresaId, status: StatusPedido.PAGO },
          _sum: { total: true },
        }),
        this.prisma.pedido.count({
          where: { empresaId, status: StatusPedido.PAGO },
        }),
        this.prisma.pedido.count({
          where: { empresaId, status: StatusPedido.PENDENTE },
        }),
        this.prisma.pedido.findMany({
          where: { empresaId },
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            codigo: true,
            status: true,
            total: true,
            compradorNome: true,
            compradorEmail: true,
            createdAt: true,
            evento: { select: { nome: true } },
            _count: { select: { ingressos: true } },
          },
        }),
      ])

    const receita = Number(receitaAgg._sum.total ?? 0)
    const ticketMedio =
      pedidosPagos > 0 ? Math.round((receita / pedidosPagos) * 100) / 100 : 0

    return {
      receita,
      pedidosPagos,
      pedidosPendentes,
      ticketMedio,
      pedidos: pedidos.map((pedido) => ({
        id: pedido.id,
        codigo: pedido.codigo,
        status: pedido.status,
        total: Number(pedido.total),
        compradorNome: pedido.compradorNome,
        compradorEmail: pedido.compradorEmail,
        eventoNome: pedido.evento.nome,
        ingressos: pedido._count.ingressos,
        createdAt: pedido.createdAt.toISOString(),
      })),
    }
  }
}
