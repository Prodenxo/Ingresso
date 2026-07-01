import { Injectable } from '@nestjs/common'
import { StatusEvento, StatusIngresso, StatusPedido } from '@prisma/client'
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

  async getControleEntrada(usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)

    const [totaisAgg, eventos, contagensPorEvento] = await Promise.all([
      this.prisma.ingresso.groupBy({
        by: ['status'],
        where: { empresaId },
        _count: { _all: true },
      }),
      this.prisma.evento.findMany({
        where: { empresaId },
        orderBy: { dataInicio: 'desc' },
        select: {
          id: true,
          nome: true,
          dataInicio: true,
          status: true,
        },
      }),
      this.prisma.ingresso.groupBy({
        by: ['eventoId', 'status'],
        where: { empresaId },
        _count: { _all: true },
      }),
    ])

    const totaisPorStatus = new Map(
      totaisAgg.map((item) => [item.status, item._count._all]),
    )

    const vendidos = totaisAgg.reduce((acc, item) => acc + item._count._all, 0)
    const validados = totaisPorStatus.get(StatusIngresso.UTILIZADO) ?? 0
    const aguardandoEntrada = totaisPorStatus.get(StatusIngresso.VALIDO) ?? 0

    const eventoStatsMap = new Map<
      string,
      { vendidos: number; validados: number; aguardandoEntrada: number }
    >()

    for (const item of contagensPorEvento) {
      const atual = eventoStatsMap.get(item.eventoId) ?? {
        vendidos: 0,
        validados: 0,
        aguardandoEntrada: 0,
      }

      atual.vendidos += item._count._all

      if (item.status === StatusIngresso.UTILIZADO) {
        atual.validados += item._count._all
      }

      if (item.status === StatusIngresso.VALIDO) {
        atual.aguardandoEntrada += item._count._all
      }

      eventoStatsMap.set(item.eventoId, atual)
    }

    const eventosComIngressos = eventos
      .map((evento) => {
        const stats = eventoStatsMap.get(evento.id) ?? {
          vendidos: 0,
          validados: 0,
          aguardandoEntrada: 0,
        }

        return {
          id: evento.id,
          nome: evento.nome,
          dataInicio: evento.dataInicio.toISOString(),
          status: evento.status,
          vendidos: stats.vendidos,
          validados: stats.validados,
          aguardandoEntrada: stats.aguardandoEntrada,
          taxaEntrada:
            stats.vendidos > 0
              ? Math.round((stats.validados / stats.vendidos) * 100)
              : 0,
        }
      })
      .filter((evento) => evento.vendidos > 0)

    return {
      totais: {
        vendidos,
        validados,
        aguardandoEntrada,
        taxaEntrada: vendidos > 0 ? Math.round((validados / vendidos) * 100) : 0,
      },
      eventos: eventosComIngressos,
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
