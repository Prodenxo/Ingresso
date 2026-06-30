import { Injectable } from '@nestjs/common'
import { Prisma, StatusEvento, StatusLote, VisibilidadeEvento } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

const eventoDisponivelSelect = {
  id: true,
  nome: true,
  slug: true,
  descricao: true,
  dataInicio: true,
  dataFim: true,
  cidade: true,
  estado: true,
  endereco: true,
  imagemUrl: true,
  bannerUrl: true,
  formato: true,
  empresa: {
    select: {
      id: true,
      nome: true,
    },
  },
  lotes: {
    select: {
      id: true,
      nome: true,
      preco: true,
      quantidade: true,
      quantidadeVendida: true,
      vendaInicio: true,
      vendaFim: true,
      limitePorCompra: true,
      status: true,
    },
  },
} satisfies Prisma.EventoSelect

type EventoDisponivelRow = Prisma.EventoGetPayload<{
  select: typeof eventoDisponivelSelect
}>

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  async findDisponiveis() {
    const now = new Date()

    const eventos = await this.prisma.evento.findMany({
      where: {
        status: StatusEvento.PUBLICADO,
        visibilidade: VisibilidadeEvento.PUBLICO,
        OR: [{ dataFim: null }, { dataFim: { gte: now } }],
        lotes: {
          some: {
            status: StatusLote.ATIVO,
            vendaInicio: { lte: now },
            vendaFim: { gte: now },
          },
        },
      },
      select: eventoDisponivelSelect,
      orderBy: { dataInicio: 'asc' },
    })

    return eventos
      .map((evento) => this.mapEventoDisponivel(evento, now))
      .filter((evento) => evento.lotes.length > 0)
  }

  private mapEventoDisponivel(evento: EventoDisponivelRow, now: Date) {
    const lotes = evento.lotes
      .filter(
        (lote) =>
          lote.status === StatusLote.ATIVO &&
          lote.vendaInicio <= now &&
          lote.vendaFim >= now &&
          lote.quantidadeVendida < lote.quantidade,
      )
      .map((lote) => ({
        id: lote.id,
        nome: lote.nome,
        preco: Number(lote.preco),
        disponiveis: lote.quantidade - lote.quantidadeVendida,
        vendaFim: lote.vendaFim,
        limitePorCompra: lote.limitePorCompra,
      }))

    return {
      id: evento.id,
      nome: evento.nome,
      slug: evento.slug,
      descricao: evento.descricao,
      dataInicio: evento.dataInicio,
      dataFim: evento.dataFim,
      cidade: evento.cidade,
      estado: evento.estado,
      endereco: evento.endereco,
      imagemUrl: evento.imagemUrl,
      bannerUrl: evento.bannerUrl,
      formato: evento.formato,
      empresa: evento.empresa,
      lotes,
    }
  }
}
