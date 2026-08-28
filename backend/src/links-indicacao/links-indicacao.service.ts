import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { StatusEvento, StatusLote, StatusPedido } from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { slugify } from '../common/utils/slug'
import { PrismaService } from '../prisma/prisma.service'
import {
  CreateLinkIndicacaoDto,
  UpdateLinkIndicacaoDto,
} from './dto/create-link-indicacao.dto'
import { aplicarDescontoIndicacao } from './link-indicacao-pricing'
import { MembrosService } from '../membros/membros.service'

const linkInclude = {
  lote: {
    select: {
      id: true,
      nome: true,
      preco: true,
    },
  },
} as const

export interface LinkIndicacaoCheckout {
  id: string
  loteId: string | null
  descontoPercentual: number | null
}

type LinkComLote = {
  descontoPercentual: { toString(): string } | number | null
  lote?: {
    id: string
    nome: string
    preco: { toString(): string } | number
  } | null
} & Record<string, unknown>

function serializarLink<T extends LinkComLote>(link: T) {
  return {
    ...link,
    descontoPercentual:
      link.descontoPercentual != null
        ? Number(link.descontoPercentual)
        : null,
    lote: link.lote
      ? {
          ...link.lote,
          preco: Number(link.lote.preco),
        }
      : link.lote,
  }
}

@Injectable()
export class LinksIndicacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
    private readonly membrosService: MembrosService,
  ) {}

  async listByEvento(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    return this.prisma.linkIndicacao
      .findMany({
        where: { eventoId, empresaId },
        include: linkInclude,
        orderBy: { createdAt: 'desc' },
      })
      .then((links) => links.map(serializarLink))
  }

  async create(eventoId: string, usuarioId: string, dto: CreateLinkIndicacaoDto) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const slug = slugify(dto.slug)

    if (slug.length < 3) {
      throw new BadRequestException(
        'A palavra-chave deve ter pelo menos 3 caracteres válidos',
      )
    }

    const slugEmUso = await this.prisma.linkIndicacao.findUnique({
      where: { slug },
    })

    if (slugEmUso) {
      throw new BadRequestException(
        'Esta palavra-chave já está em uso. Escolha outra.',
      )
    }

    await this.validarLoteDoEvento(dto.loteId, eventoId, empresaId)

    const created = await this.prisma.linkIndicacao.create({
      data: {
        empresaId,
        eventoId,
        nome: dto.nome.trim(),
        slug,
        loteId: dto.loteId,
        descontoPercentual: dto.descontoPercentual,
      },
      include: linkInclude,
    })

    return serializarLink(created)
  }

  async update(linkId: string, usuarioId: string, dto: UpdateLinkIndicacaoDto) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    const link = await this.findOwnedLink(linkId, empresaId)

    if (dto.loteId !== undefined) {
      await this.validarLoteDoEvento(dto.loteId, link.eventoId, empresaId)
    }

    const updated = await this.prisma.linkIndicacao.update({
      where: { id: link.id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
        ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
        ...(dto.loteId !== undefined ? { loteId: dto.loteId } : {}),
        ...(dto.descontoPercentual !== undefined
          ? { descontoPercentual: dto.descontoPercentual }
          : {}),
      },
      include: linkInclude,
    })

    return serializarLink(updated)
  }

  async remove(linkId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    const link = await this.findOwnedLink(linkId, empresaId)

    const pedidosCount = await this.prisma.pedido.count({
      where: { linkIndicacaoId: link.id },
    })

    if (pedidosCount > 0) {
      throw new BadRequestException(
        'Não é possível excluir link com pedidos vinculados. Desative-o em vez disso.',
      )
    }

    await this.prisma.linkIndicacao.delete({ where: { id: link.id } })

    return { deleted: true }
  }

  async resolverPublico(slugParam: string) {
    const slug = slugify(slugParam)

    const link = await this.prisma.linkIndicacao.findUnique({
      where: { slug },
      include: {
        evento: {
          select: {
            id: true,
            nome: true,
            status: true,
          },
        },
        lote: {
          select: {
            id: true,
            nome: true,
            preco: true,
          },
        },
        empresa: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    })

    if (!link || !link.ativo || link.evento.status !== StatusEvento.PUBLICADO) {
      throw new NotFoundException('Link de indicação não encontrado')
    }

    await this.prisma.linkIndicacao.update({
      where: { id: link.id },
      data: { cliques: { increment: 1 } },
    })

    const lotePreco = link.lote ? Number(link.lote.preco) : null
    const descontoPercentual = link.descontoPercentual
      ? Number(link.descontoPercentual)
      : null

    return {
      slug: link.slug,
      nome: link.nome,
      eventoId: link.eventoId,
      eventoNome: link.evento.nome,
      empresaNome: link.empresa.nome,
      loteId: link.loteId,
      loteNome: link.lote?.nome ?? null,
      lotePreco,
      descontoPercentual,
      precoComDesconto:
        lotePreco !== null
          ? aplicarDescontoIndicacao(lotePreco, descontoPercentual)
          : null,
    }
  }

  async getRelatorioEvento(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const links = await this.prisma.linkIndicacao.findMany({
      where: { eventoId, empresaId },
      include: linkInclude,
      orderBy: { createdAt: 'desc' },
    })

    const relatorio = await Promise.all(
      links.map(async (link) => {
        const pedidos = await this.prisma.pedido.findMany({
          where: { linkIndicacaoId: link.id },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            codigo: true,
            status: true,
            total: true,
            compradorNome: true,
            compradorEmail: true,
            createdAt: true,
          },
        })

        const pedidosPagos = pedidos.filter(
          (pedido) => pedido.status === StatusPedido.PAGO,
        )

        const receita = pedidosPagos.reduce(
          (acc, pedido) => acc + Number(pedido.total),
          0,
        )

        return {
          link: {
            id: link.id,
            nome: link.nome,
            slug: link.slug,
            ativo: link.ativo,
            cliques: link.cliques,
            createdAt: link.createdAt,
            loteId: link.loteId,
            loteNome: link.lote?.nome ?? null,
            descontoPercentual: link.descontoPercentual
              ? Number(link.descontoPercentual)
              : null,
          },
          metricas: {
            cliques: link.cliques,
            pedidosIniciados: pedidos.length,
            pedidosPagos: pedidosPagos.length,
            receita,
            taxaConversao:
              link.cliques > 0
                ? Math.round((pedidosPagos.length / link.cliques) * 1000) / 10
                : 0,
          },
          pedidos: pedidos.map((pedido) => ({
            id: pedido.id,
            codigo: pedido.codigo,
            status: pedido.status,
            total: Number(pedido.total),
            compradorNome: pedido.compradorNome,
            compradorEmail: pedido.compradorEmail,
            createdAt: pedido.createdAt,
          })),
        }
      }),
    )

    return relatorio
  }

  async resolverLinkParaCheckout(
    slug: string | undefined,
    empresaId: string,
    eventoId: string,
    loteId: string,
  ): Promise<LinkIndicacaoCheckout | null> {
    if (!slug?.trim()) {
      return null
    }

    const normalized = slugify(slug.trim())
    const link = await this.prisma.linkIndicacao.findFirst({
      where: {
        slug: normalized,
        empresaId,
        eventoId,
        ativo: true,
      },
    })

    if (!link) {
      throw new BadRequestException('Link de indicação inválido ou inativo')
    }

    if (link.loteId && link.loteId !== loteId) {
      throw new BadRequestException(
        'Este link de indicação é válido apenas para o ingresso vinculado a ele',
      )
    }

    return {
      id: link.id,
      loteId: link.loteId,
      descontoPercentual: link.descontoPercentual
        ? Number(link.descontoPercentual)
        : null,
    }
  }

  calcularPrecoUnitarioComLink(
    precoLote: number,
    link: LinkIndicacaoCheckout | null,
  ): number {
    if (!link) {
      return precoLote
    }

    return aplicarDescontoIndicacao(precoLote, link.descontoPercentual)
  }

  async vincularParticipante(slugParam: string, usuarioId: string) {
    const slug = slugify(slugParam)

    const link = await this.prisma.linkIndicacao.findFirst({
      where: { slug, ativo: true },
      include: {
        evento: {
          select: { status: true },
        },
      },
    })

    if (!link || link.evento.status !== StatusEvento.PUBLICADO) {
      throw new NotFoundException('Link de indicação inválido ou indisponível')
    }

    return this.membrosService.vincularPorEmpresaId(usuarioId, link.empresaId)
  }

  private async validarLoteDoEvento(
    loteId: string,
    eventoId: string,
    empresaId: string,
  ) {
    const lote = await this.prisma.lote.findFirst({
      where: { id: loteId, eventoId, empresaId },
    })

    if (!lote) {
      throw new BadRequestException(
        'Tipo de ingresso inválido para este evento',
      )
    }

    if (lote.status !== StatusLote.ATIVO) {
      throw new BadRequestException(
        'O tipo de ingresso selecionado não está ativo',
      )
    }
  }

  private async findOwnedLink(linkId: string, empresaId: string) {
    const link = await this.prisma.linkIndicacao.findFirst({
      where: { id: linkId, empresaId },
    })

    if (!link) {
      throw new NotFoundException('Link de indicação não encontrado')
    }

    return link
  }
}
