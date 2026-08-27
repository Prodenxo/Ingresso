import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { StatusEvento, StatusPedido } from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { slugify } from '../common/utils/slug'
import { PrismaService } from '../prisma/prisma.service'
import { CreateLinkIndicacaoDto, UpdateLinkIndicacaoDto } from './dto/create-link-indicacao.dto'

@Injectable()
export class LinksIndicacaoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
  ) {}

  async listByEvento(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    return this.prisma.linkIndicacao.findMany({
      where: { eventoId, empresaId },
      orderBy: { createdAt: 'desc' },
    })
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

    return this.prisma.linkIndicacao.create({
      data: {
        empresaId,
        eventoId,
        nome: dto.nome.trim(),
        slug,
      },
    })
  }

  async update(linkId: string, usuarioId: string, dto: UpdateLinkIndicacaoDto) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    const link = await this.findOwnedLink(linkId, empresaId)

    return this.prisma.linkIndicacao.update({
      where: { id: link.id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
        ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
      },
    })
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
      },
    })

    if (!link || !link.ativo || link.evento.status !== StatusEvento.PUBLICADO) {
      throw new NotFoundException('Link de indicação não encontrado')
    }

    await this.prisma.linkIndicacao.update({
      where: { id: link.id },
      data: { cliques: { increment: 1 } },
    })

    return {
      slug: link.slug,
      nome: link.nome,
      eventoId: link.eventoId,
      eventoNome: link.evento.nome,
    }
  }

  async getRelatorioEvento(eventoId: string, usuarioId: string) {
    const empresaId = await this.empresaAccess.resolveEmpresaId(usuarioId)
    await this.empresaAccess.assertEventoOwnership(eventoId, empresaId)

    const links = await this.prisma.linkIndicacao.findMany({
      where: { eventoId, empresaId },
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
  ): Promise<string | null> {
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

    return link.id
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
