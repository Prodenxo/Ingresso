import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { ModoCheckinEvento, StatusEvento, StatusIngresso } from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { ValidarCheckinDto } from './dto/validar-checkin.dto'

type ResultadoCheckin =
  | 'VALIDO'
  | 'JA_REGISTRADO'
  | 'SEQUENCIA_INVALIDA'
  | 'INVALIDO'
  | 'JA_UTILIZADO'

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
        modoCheckin: true,
        checkinDias: true,
        pontosCheckin: {
          orderBy: { ordem: 'asc' },
          select: { id: true, ordem: true, nome: true },
        },
        _count: {
          select: {
            ingressos: {
              where: { status: StatusIngresso.UTILIZADO },
            },
          },
        },
      },
    })

    const batePontoIds = eventos
      .filter((e) => e.modoCheckin === ModoCheckinEvento.BATE_PONTO)
      .map((e) => e.id)

    const checkinsValidosPorEvento = new Map<string, number>()

    if (batePontoIds.length > 0) {
      const agrupados = await this.prisma.checkin.groupBy({
        by: ['ingressoId'],
        where: {
          valido: true,
          ingresso: { eventoId: { in: batePontoIds } },
        },
        _count: { id: true },
      })

      const ingressos = await this.prisma.ingresso.findMany({
        where: { eventoId: { in: batePontoIds } },
        select: { id: true, eventoId: true },
      })

      const eventoPorIngresso = new Map(
        ingressos.map((i) => [i.id, i.eventoId]),
      )

      for (const item of agrupados) {
        const eventoId = eventoPorIngresso.get(item.ingressoId)
        if (!eventoId) continue
        checkinsValidosPorEvento.set(
          eventoId,
          (checkinsValidosPorEvento.get(eventoId) ?? 0) + item._count.id,
        )
      }
    }

    return eventos.map((evento) => ({
      id: evento.id,
      nome: evento.nome,
      dataInicio: evento.dataInicio.toISOString(),
      dataFim: evento.dataFim?.toISOString() ?? null,
      cidade: evento.cidade,
      estado: evento.estado,
      status: evento.status,
      modoCheckin: evento.modoCheckin,
      checkinDias: evento.checkinDias,
      pontosCheckin: evento.pontosCheckin,
      checkinsRealizados:
        evento.modoCheckin === ModoCheckinEvento.BATE_PONTO
          ? (checkinsValidosPorEvento.get(evento.id) ?? 0)
          : evento._count.ingressos,
    }))
  }

  async validar(usuarioId: string, dto: ValidarCheckinDto) {
    const empresaId = await this.empresaAccess.assertCheckinAccess(usuarioId)
    const codigo = this.normalizarCodigo(dto.codigo)

    const evento = await this.prisma.evento.findFirst({
      where: { id: dto.eventoId, empresaId },
      select: {
        id: true,
        nome: true,
        modoCheckin: true,
        checkinDias: true,
        pontosCheckin: {
          orderBy: { ordem: 'asc' },
          select: { id: true, ordem: true, nome: true },
        },
      },
    })

    if (!evento) {
      throw new NotFoundException('Evento não encontrado')
    }

    const ingresso = await this.buscarIngresso(empresaId, codigo)

    if (!ingresso) {
      return this.respostaInvalida('Ingresso não encontrado')
    }

    if (ingresso.eventoId !== evento.id) {
      await this.registrarTentativaInvalida(
        empresaId,
        usuarioId,
        `Ingresso de outro evento (${codigo})`,
        ingresso.id,
      )

      return this.respostaInvalida(
        `Este ingresso é do evento "${ingresso.evento.nome}"`,
        ingresso,
      )
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

      return this.respostaInvalida(
        'Ingresso cancelado ou expirado',
        ingresso,
      )
    }

    if (evento.modoCheckin === ModoCheckinEvento.BATE_PONTO) {
      return this.validarBatePonto(
        empresaId,
        usuarioId,
        evento,
        ingresso,
        dto,
      )
    }

    return this.validarPortaUnica(empresaId, usuarioId, ingresso)
  }

  async obterRelatorio(usuarioId: string, eventoId: string) {
    const empresaId = await this.empresaAccess.assertCheckinAccess(usuarioId)

    const evento = await this.prisma.evento.findFirst({
      where: { id: eventoId, empresaId },
      select: {
        id: true,
        nome: true,
        modoCheckin: true,
        checkinDias: true,
        pontosCheckin: {
          orderBy: { ordem: 'asc' },
          select: { id: true, ordem: true, nome: true },
        },
      },
    })

    if (!evento) {
      throw new NotFoundException('Evento não encontrado')
    }

    if (evento.modoCheckin !== ModoCheckinEvento.BATE_PONTO) {
      throw new BadRequestException(
        'Relatório detalhado disponível apenas para eventos bate-ponto',
      )
    }

    const ingressos = await this.prisma.ingresso.findMany({
      where: {
        eventoId,
        empresaId,
        status: { in: [StatusIngresso.VALIDO, StatusIngresso.UTILIZADO] },
      },
      select: {
        id: true,
        participanteNome: true,
        participanteEmail: true,
        qrCodeUrl: true,
        status: true,
        lote: { select: { nome: true } },
        checkins: {
          where: { valido: true },
          select: {
            diaEvento: true,
            createdAt: true,
            pontoCheckin: { select: { id: true, ordem: true, nome: true } },
          },
        },
      },
      orderBy: { participanteNome: 'asc' },
    })

    const totalPontosPorDia = evento.pontosCheckin.length
    const totalEsperado = evento.checkinDias * totalPontosPorDia

    const participantes = ingressos.map((ingresso) => {
      const registros = ingresso.checkins
        .filter((c) => c.diaEvento && c.pontoCheckin)
        .map((c) => ({
          diaEvento: c.diaEvento!,
          pontoId: c.pontoCheckin!.id,
          pontoOrdem: c.pontoCheckin!.ordem,
          pontoNome: c.pontoCheckin!.nome,
          realizadoEm: c.createdAt.toISOString(),
        }))

      const diasPresentes = new Set(registros.map((r) => r.diaEvento))
      const temDia1 = diasPresentes.has(1)
      const temDia2 = evento.checkinDias >= 2 ? diasPresentes.has(2) : false

      let inconsistencia: string | null = null

      if (temDia2 && !temDia1) {
        inconsistencia = 'Presente no dia 2 sem registro no dia 1'
      } else if (temDia1 && evento.checkinDias >= 2 && !temDia2) {
        inconsistencia = 'Presente no dia 1 e ausente no dia 2'
      } else if (registros.length > 0 && registros.length < totalEsperado) {
        inconsistencia = 'Sequência incompleta'
      }

      return {
        ingressoId: ingresso.id,
        participanteNome: ingresso.participanteNome,
        participanteEmail: ingresso.participanteEmail,
        codigo: ingresso.qrCodeUrl,
        loteNome: ingresso.lote.nome,
        status: ingresso.status,
        registros,
        totalRegistros: registros.length,
        totalEsperado,
        inconsistencia,
      }
    })

    return {
      evento: {
        id: evento.id,
        nome: evento.nome,
        checkinDias: evento.checkinDias,
        pontosCheckin: evento.pontosCheckin,
      },
      resumo: {
        totalParticipantes: participantes.length,
        completos: participantes.filter((p) => p.totalRegistros === totalEsperado)
          .length,
        comInconsistencia: participantes.filter((p) => p.inconsistencia).length,
        soDia1: participantes.filter(
          (p) =>
            p.inconsistencia === 'Presente no dia 1 e ausente no dia 2',
        ).length,
        soDia2: participantes.filter(
          (p) => p.inconsistencia === 'Presente no dia 2 sem registro no dia 1',
        ).length,
      },
      participantes,
    }
  }

  private async validarPortaUnica(
    empresaId: string,
    usuarioId: string,
    ingresso: Awaited<ReturnType<CheckInService['buscarIngresso']>> & object,
  ) {
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

  private async validarBatePonto(
    empresaId: string,
    usuarioId: string,
    evento: {
      id: string
      nome: string
      checkinDias: number
      pontosCheckin: Array<{ id: string; ordem: number; nome: string }>
    },
    ingresso: NonNullable<Awaited<ReturnType<CheckInService['buscarIngresso']>>>,
    dto: ValidarCheckinDto,
  ) {
    if (!dto.diaEvento || !dto.pontoCheckinId) {
      return this.respostaInvalida(
        'Informe o dia e o ponto de check-in',
        ingresso,
      )
    }

    if (dto.diaEvento > evento.checkinDias) {
      return this.respostaInvalida(
        `Este evento possui apenas ${evento.checkinDias} dia(s)`,
        ingresso,
      )
    }

    const pontoIndex = evento.pontosCheckin.findIndex(
      (p) => p.id === dto.pontoCheckinId,
    )

    if (pontoIndex === -1) {
      return this.respostaInvalida('Ponto de check-in inválido', ingresso)
    }

    const ponto = evento.pontosCheckin[pontoIndex]!
    const checkinsValidos = ingresso.checkins.filter((c) => c.valido)

    const jaRegistrado = checkinsValidos.find(
      (c) =>
        c.diaEvento === dto.diaEvento &&
        c.pontoCheckinId === dto.pontoCheckinId,
    )

    if (jaRegistrado) {
      return {
        resultado: 'JA_REGISTRADO' as const,
        motivo: `${ponto.nome} (Dia ${dto.diaEvento}) já registrado`,
        ingresso: this.mapIngressoResumo(ingresso),
        checkin: {
          realizadoEm: jaRegistrado.createdAt.toISOString(),
          operadorNome: jaRegistrado.operador.nome,
          pontoNome: ponto.nome,
          diaEvento: dto.diaEvento,
        },
      }
    }

    const sequenciaOk = this.validarSequencia(
      evento,
      checkinsValidos,
      dto.diaEvento,
      pontoIndex,
    )

    if (!sequenciaOk.valido) {
      await this.registrarTentativaInvalida(
        empresaId,
        usuarioId,
        sequenciaOk.motivo ?? 'Sequência inválida',
        ingresso.id,
        dto.diaEvento,
        dto.pontoCheckinId,
      )

      return {
        resultado: 'SEQUENCIA_INVALIDA' as const,
        motivo: sequenciaOk.motivo,
        ingresso: this.mapIngressoResumo(ingresso),
      }
    }

    const agora = new Date()
    const ultimoPonto = evento.pontosCheckin[evento.pontosCheckin.length - 1]!
    const ultimoDia = evento.checkinDias
    const isUltimoCheckin =
      dto.diaEvento === ultimoDia && ponto.id === ultimoPonto.id

    await this.prisma.$transaction(async (tx) => {
      await tx.checkin.create({
        data: {
          empresaId,
          ingressoId: ingresso.id,
          operadorId: usuarioId,
          pontoCheckinId: dto.pontoCheckinId,
          diaEvento: dto.diaEvento,
          valido: true,
          motivo: null,
        },
      })

      if (isUltimoCheckin) {
        await tx.ingresso.update({
          where: { id: ingresso.id },
          data: {
            status: StatusIngresso.UTILIZADO,
            utilizadoEm: agora,
          },
        })
      }
    })

    return {
      resultado: 'VALIDO' as const,
      ingresso: this.mapIngressoResumo(ingresso),
      checkin: {
        realizadoEm: agora.toISOString(),
        pontoNome: ponto.nome,
        diaEvento: dto.diaEvento,
      },
    }
  }

  private validarSequencia(
    evento: {
      checkinDias: number
      pontosCheckin: Array<{ id: string; ordem: number; nome: string }>
    },
    checkinsValidos: Array<{
      diaEvento: number | null
      pontoCheckinId: string | null
    }>,
    diaEvento: number,
    pontoIndex: number,
  ): { valido: boolean; motivo?: string } {
    const ponto = evento.pontosCheckin[pontoIndex]!

    if (pontoIndex > 0) {
      const pontoAnterior = evento.pontosCheckin[pontoIndex - 1]!
      const anteriorOk = checkinsValidos.some(
        (c) =>
          c.diaEvento === diaEvento &&
          c.pontoCheckinId === pontoAnterior.id,
      )

      if (!anteriorOk) {
        return {
          valido: false,
          motivo: `Registre "${pontoAnterior.nome}" (Dia ${diaEvento}) antes`,
        }
      }

      return { valido: true }
    }

    if (diaEvento === 1) {
      return { valido: true }
    }

    const ultimoPonto = evento.pontosCheckin[evento.pontosCheckin.length - 1]!
    const diaAnteriorCompleto = checkinsValidos.some(
      (c) =>
        c.diaEvento === diaEvento - 1 &&
        c.pontoCheckinId === ultimoPonto.id,
    )

    if (!diaAnteriorCompleto) {
      return {
        valido: false,
        motivo: `Conclua o Dia ${diaEvento - 1} antes de iniciar o Dia ${diaEvento}`,
      }
    }

    return { valido: true }
  }

  private async buscarIngresso(empresaId: string, codigo: string) {
    return this.prisma.ingresso.findFirst({
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
          include: {
            operador: { select: { nome: true } },
            pontoCheckin: { select: { id: true, nome: true, ordem: true } },
          },
        },
      },
    })
  }

  private respostaInvalida(
    motivo: string,
    ingresso?: NonNullable<Awaited<ReturnType<CheckInService['buscarIngresso']>>>,
  ) {
    return {
      resultado: 'INVALIDO' as const,
      motivo,
      ingresso: ingresso ? this.mapIngressoResumo(ingresso) : undefined,
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
    diaEvento?: number,
    pontoCheckinId?: string,
  ) {
    await this.prisma.checkin.create({
      data: {
        empresaId,
        ingressoId,
        operadorId,
        valido: false,
        motivo,
        diaEvento,
        pontoCheckinId,
      },
    })
  }
}
