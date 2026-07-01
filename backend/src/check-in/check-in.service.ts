import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { StatusEvento, StatusIngresso } from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { ValidarCheckinDto } from './dto/validar-checkin.dto'

@Injectable()
export class CheckInService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
  ) {}

  async listarEventos(usuarioId: string) {
    const empresaId = await this.empresaAccess.assertCheckinAccess(usuarioId)

    const eventos = await this.prisma.evento.findMany({
      where: {
        empresaId,
        status: {
          in: [StatusEvento.PUBLICADO, StatusEvento.ENCERRADO],
        },
      },
      orderBy: { dataInicio: 'desc' },
      select: {
        id: true,
        nome: true,
        dataInicio: true,
        dataFim: true,
        cidade: true,
        estado: true,
        status: true,
        _count: {
          select: {
            ingressos: {
              where: { status: StatusIngresso.UTILIZADO },
            },
          },
        },
      },
    })

    return eventos.map((evento) => ({
      id: evento.id,
      nome: evento.nome,
      dataInicio: evento.dataInicio.toISOString(),
      dataFim: evento.dataFim?.toISOString() ?? null,
      cidade: evento.cidade,
      estado: evento.estado,
      status: evento.status,
      checkinsRealizados: evento._count.ingressos,
    }))
  }

  async validar(usuarioId: string, dto: ValidarCheckinDto) {
    const empresaId = await this.empresaAccess.assertCheckinAccess(usuarioId)
    const codigo = this.normalizarCodigo(dto.codigo)

    const evento = await this.prisma.evento.findFirst({
      where: { id: dto.eventoId, empresaId },
      select: { id: true, nome: true },
    })

    if (!evento) {
      throw new NotFoundException('Evento não encontrado')
    }

    const ingresso = await this.prisma.ingresso.findFirst({
      where: {
        empresaId,
        qrCodeUrl: codigo,
      },
      include: {
        lote: { select: { nome: true } },
        evento: { select: { id: true, nome: true } },
        checkins: {
          where: { valido: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            operador: { select: { nome: true } },
          },
        },
      },
    })

    if (!ingresso) {
      return {
        resultado: 'INVALIDO' as const,
        motivo: 'Ingresso não encontrado',
      }
    }

    if (ingresso.eventoId !== evento.id) {
      await this.registrarTentativaInvalida(
        empresaId,
        usuarioId,
        `Ingresso de outro evento (${codigo})`,
        ingresso.id,
      )

      return {
        resultado: 'INVALIDO' as const,
        motivo: `Este ingresso é do evento "${ingresso.evento.nome}"`,
        ingresso: this.mapIngressoResumo(ingresso),
      }
    }

    if (
      ingresso.status === StatusIngresso.CANCELADO ||
      ingresso.status === StatusIngresso.EXPIRADO
    ) {
      await this.registrarTentativaInvalida(
        empresaId,
        usuarioId,
        `Ingresso ${ingresso.status.toLowerCase()} (${codigo})`,
        ingresso.id,
      )

      return {
        resultado: 'INVALIDO' as const,
        motivo: 'Ingresso cancelado ou expirado',
        ingresso: this.mapIngressoResumo(ingresso),
      }
    }

    if (ingresso.status === StatusIngresso.UTILIZADO) {
      const ultimoCheckin = ingresso.checkins[0]

      return {
        resultado: 'JA_UTILIZADO' as const,
        ingresso: this.mapIngressoResumo(ingresso),
        checkin: ultimoCheckin
          ? {
              realizadoEm: ultimoCheckin.createdAt.toISOString(),
              operadorNome: ultimoCheckin.operador.nome,
              local: ultimoCheckin.local,
            }
          : null,
      }
    }

    const agora = new Date()

    await this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.ingresso.updateMany({
        where: {
          id: ingresso.id,
          status: StatusIngresso.VALIDO,
        },
        data: {
          status: StatusIngresso.UTILIZADO,
          utilizadoEm: agora,
        },
      })

      if (atualizado.count === 0) {
        throw new BadRequestException('Ingresso já foi utilizado')
      }

      await tx.checkin.create({
        data: {
          empresaId,
          ingressoId: ingresso.id,
          operadorId: usuarioId,
          valido: true,
          motivo: null,
        },
      })
    })

    return {
      resultado: 'VALIDO' as const,
      ingresso: {
        ...this.mapIngressoResumo(ingresso),
        utilizadoEm: agora.toISOString(),
      },
    }
  }

  private normalizarCodigo(codigo: string): string {
    return codigo.trim().toUpperCase()
  }

  private mapIngressoResumo(ingresso: {
    id: string
    participanteNome: string
    participanteEmail: string
    status: StatusIngresso
    qrCodeUrl: string | null
    utilizadoEm: Date | null
    lote: { nome: string }
    evento: { id: string; nome: string }
  }) {
    return {
      id: ingresso.id,
      participanteNome: ingresso.participanteNome,
      participanteEmail: ingresso.participanteEmail,
      status: ingresso.status,
      codigo: ingresso.qrCodeUrl,
      loteNome: ingresso.lote.nome,
      eventoNome: ingresso.evento.nome,
      utilizadoEm: ingresso.utilizadoEm?.toISOString() ?? null,
    }
  }

  private async registrarTentativaInvalida(
    empresaId: string,
    operadorId: string,
    motivo: string,
    ingressoId: string,
  ) {
    await this.prisma.checkin.create({
      data: {
        empresaId,
        ingressoId,
        operadorId,
        valido: false,
        motivo,
      },
    })
  }
}
