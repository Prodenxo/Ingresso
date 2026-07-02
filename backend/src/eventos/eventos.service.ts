import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import {
  ModoCheckinEvento,
  Prisma,
  StatusEvento,
  StatusLote,
  VisibilidadeEvento,
} from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { buildUniqueSlug } from '../common/utils/slug'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventoDto } from './dto/create-evento.dto'
import { CreateLoteDto } from './dto/create-lote.dto'
import { ConfigCheckinEventoDto } from './dto/config-checkin-evento.dto'
import { UpdateEventoDto } from './dto/update-evento.dto'
import { EventosMediaService } from './eventos-media.service'

const eventoAdminSelect = {
  id: true,
  nome: true,
  slug: true,
  descricao: true,
  dataInicio: true,
  dataFim: true,
  cidade: true,
  estado: true,
  endereco: true,
  capacidade: true,
  status: true,
  visibilidade: true,
  formato: true,
  imagemUrl: true,
  bannerUrl: true,
  modoCheckin: true,
  checkinDias: true,
  createdAt: true,
  updatedAt: true,
  pontosCheckin: {
    orderBy: { ordem: 'asc' as const },
    select: { id: true, ordem: true, nome: true },
  },
  _count: {
    select: {
      lotes: true,
      pedidos: true,
    },
  },
} satisfies Prisma.EventoSelect

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
      precoDe: true,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
    private readonly mediaService: EventosMediaService,
  ) {}

  async findDisponiveis(usuarioId: string) {
    const empresaIds =
      await this.empresaAccess.getEmpresasVinculadasIds(usuarioId)

    if (empresaIds.length === 0) {
      return []
    }

    const now = new Date()

    const eventos = await this.prisma.evento.findMany({
      where: {
        empresaId: { in: empresaIds },
        status: StatusEvento.PUBLICADO,
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

  async findAllAdmin(usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)

    return this.prisma.evento.findMany({
      where: { empresaId },
      select: eventoAdminSelect,
      orderBy: { dataInicio: 'desc' },
    })
  }

  async findOneAdmin(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)

    const evento = await this.prisma.evento.findFirst({
      where: { id: eventoId, empresaId },
      include: {
        lotes: {
          orderBy: { vendaInicio: 'asc' },
        },
        pontosCheckin: {
          orderBy: { ordem: 'asc' },
        },
      },
    })

    if (!evento) {
      throw new NotFoundException('Evento não encontrado')
    }

    return this.mapEventoAdminDetalhe(evento)
  }

  async configurarCheckin(
    eventoId: string,
    usuarioId: string,
    dto: ConfigCheckinEventoDto,
  ) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const pontos = [...dto.pontos].sort((a, b) => a.ordem - b.ordem)

    if (dto.batePonto) {
      if (pontos.length === 0) {
        throw new BadRequestException('Adicione pelo menos um ponto de check-in')
      }

      const ordens = new Set(pontos.map((p) => p.ordem))
      if (ordens.size !== pontos.length) {
        throw new BadRequestException('Ordens dos pontos devem ser únicas')
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.evento.update({
        where: { id: eventoId },
        data: {
          modoCheckin: dto.batePonto
            ? ModoCheckinEvento.BATE_PONTO
            : ModoCheckinEvento.PORTA_UNICA,
          checkinDias: dto.batePonto ? dto.dias : 1,
        },
      })

      await tx.eventoPontoCheckin.deleteMany({ where: { eventoId } })

      if (dto.batePonto) {
        await tx.eventoPontoCheckin.createMany({
          data: pontos.map((ponto) => ({
            empresaId,
            eventoId,
            ordem: ponto.ordem,
            nome: ponto.nome.trim(),
          })),
        })
      }
    })

    return this.findOneAdmin(eventoId, usuarioId)
  }

  async create(usuarioId: string, dto: CreateEventoDto) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    const slug = await buildUniqueSlug(dto.nome, async (candidate) => {
      const exists = await this.prisma.evento.findFirst({
        where: { empresaId, slug: candidate },
      })
      return Boolean(exists)
    })

    return this.prisma.evento.create({
      data: {
        empresaId,
        nome: dto.nome.trim(),
        slug,
        descricao: dto.descricao?.trim(),
        dataInicio: new Date(dto.dataInicio),
        dataFim: dto.dataFim ? new Date(dto.dataFim) : null,
        cidade: dto.cidade?.trim(),
        estado: dto.estado?.trim(),
        endereco: dto.endereco?.trim(),
        formato: dto.formato,
        capacidade: dto.capacidade ?? 0,
        status: StatusEvento.RASCUNHO,
        visibilidade: VisibilidadeEvento.PUBLICO,
      },
      select: eventoAdminSelect,
    })
  }

  async update(eventoId: string, usuarioId: string, dto: UpdateEventoDto) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const data: Prisma.EventoUpdateInput = {}

    if (dto.nome !== undefined) {
      data.nome = dto.nome.trim()
      data.slug = await buildUniqueSlug(dto.nome, async (candidate) => {
        const exists = await this.prisma.evento.findFirst({
          where: { empresaId, slug: candidate, NOT: { id: eventoId } },
        })
        return Boolean(exists)
      })
    }

    if (dto.descricao !== undefined) data.descricao = dto.descricao.trim()
    if (dto.dataInicio !== undefined) data.dataInicio = new Date(dto.dataInicio)
    if (dto.dataFim !== undefined) {
      data.dataFim = dto.dataFim ? new Date(dto.dataFim) : null
    }
    if (dto.cidade !== undefined) data.cidade = dto.cidade.trim()
    if (dto.estado !== undefined) data.estado = dto.estado.trim()
    if (dto.endereco !== undefined) data.endereco = dto.endereco.trim()
    if (dto.formato !== undefined) data.formato = dto.formato
    if (dto.capacidade !== undefined) data.capacidade = dto.capacidade

    return this.prisma.evento.update({
      where: { id: eventoId },
      data,
      select: eventoAdminSelect,
    })
  }

  async publicar(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const lotesCount = await this.prisma.lote.count({
      where: { eventoId, empresaId },
    })

    if (lotesCount === 0) {
      throw new BadRequestException(
        'Adicione pelo menos um lote antes de publicar o evento',
      )
    }

    return this.prisma.evento.update({
      where: { id: eventoId },
      data: { status: StatusEvento.PUBLICADO },
      select: eventoAdminSelect,
    })
  }

  async remove(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const evento = await this.prisma.evento.findFirst({
      where: { id: eventoId, empresaId },
      select: { imagemUrl: true, bannerUrl: true },
    })

    if (evento) {
      this.mediaService.removeByPublicUrl(evento.imagemUrl)
      if (evento.bannerUrl !== evento.imagemUrl) {
        this.mediaService.removeByPublicUrl(evento.bannerUrl)
      }
    }

    await this.prisma.evento.delete({ where: { id: eventoId } })

    return { deleted: true }
  }

  async createLote(
    eventoId: string,
    usuarioId: string,
    dto: CreateLoteDto,
  ) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const vendaInicio = new Date(dto.vendaInicio)
    const vendaFim = new Date(dto.vendaFim)

    if (vendaFim <= vendaInicio) {
      throw new BadRequestException(
        'A data final de venda deve ser posterior à inicial',
      )
    }

    if (dto.precoDe !== undefined && dto.precoDe <= dto.preco) {
      throw new BadRequestException(
        'O preço âncora deve ser maior que o valor unitário de venda',
      )
    }

    return this.prisma.lote.create({
      data: {
        empresaId,
        eventoId,
        nome: dto.nome.trim(),
        preco: dto.preco,
        precoDe: dto.precoDe,
        quantidade: dto.quantidade,
        vendaInicio,
        vendaFim,
        limitePorCompra: dto.limitePorCompra ?? 1,
        status: StatusLote.ATIVO,
      },
    })
  }

  async removeLote(eventoId: string, loteId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, eventoId, empresaId },
    })

    if (!lote) {
      throw new NotFoundException('Lote não encontrado')
    }

    if (lote.quantidadeVendida > 0) {
      throw new BadRequestException(
        'Não é possível excluir lote com vendas registradas',
      )
    }

    await this.prisma.lote.delete({ where: { id: loteId } })

    return { deleted: true }
  }

  async uploadFlyer(
    eventoId: string,
    usuarioId: string,
    file: Express.Multer.File,
  ) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const evento = await this.prisma.evento.findFirst({
      where: { id: eventoId, empresaId },
      select: { imagemUrl: true },
    })

    if (!evento) {
      throw new NotFoundException('Evento não encontrado')
    }

    const imagemUrl = await this.mediaService.saveFlyer(file, evento.imagemUrl)

    return this.prisma.evento.update({
      where: { id: eventoId },
      data: {
        imagemUrl,
        bannerUrl: imagemUrl,
      },
      select: eventoAdminSelect,
    })
  }

  async removeFlyer(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const evento = await this.prisma.evento.findFirst({
      where: { id: eventoId, empresaId },
      select: { imagemUrl: true, bannerUrl: true },
    })

    if (!evento) {
      throw new NotFoundException('Evento não encontrado')
    }

    this.mediaService.removeByPublicUrl(evento.imagemUrl)
    if (evento.bannerUrl !== evento.imagemUrl) {
      this.mediaService.removeByPublicUrl(evento.bannerUrl)
    }

    return this.prisma.evento.update({
      where: { id: eventoId },
      data: {
        imagemUrl: null,
        bannerUrl: null,
      },
      select: eventoAdminSelect,
    })
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
        precoDe: lote.precoDe ? Number(lote.precoDe) : null,
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

  private mapEventoAdminDetalhe(
    evento: Prisma.EventoGetPayload<{ include: { lotes: true } }>,
  ) {
    return {
      ...evento,
      lotes: evento.lotes.map((lote) => ({
        ...lote,
        preco: Number(lote.preco),
        precoDe: lote.precoDe ? Number(lote.precoDe) : null,
        taxa: Number(lote.taxa),
        disponiveis: lote.quantidade - lote.quantidadeVendida,
      })),
    }
  }
}
