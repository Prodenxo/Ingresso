import { Injectable } from '@nestjs/common'
import { ModoCheckinEvento, StatusIngresso } from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class IngressosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
  ) {}

  async findByParticipante(usuarioId: string, email: string) {
    const empresaIds =
      await this.empresaAccess.getEmpresasVinculadasIds(usuarioId)

    if (empresaIds.length === 0) {
      return []
    }

    const participanteEmail = email.trim().toLowerCase()

    const ingressos = await this.prisma.ingresso.findMany({
      where: {
        empresaId: { in: empresaIds },
        OR: [
          { participanteEmail: participanteEmail },
          { pedido: { compradorEmail: participanteEmail } },
        ],
      },
      select: {
        id: true,
        status: true,
        participanteNome: true,
        participanteCpf: true,
        participanteTelefone: true,
        qrCodeUrl: true,
        utilizadoEm: true,
        createdAt: true,
        evento: {
          select: {
            id: true,
            nome: true,
            dataInicio: true,
            cidade: true,
            estado: true,
            modoCheckin: true,
            checkinDias: true,
            pontosCheckin: {
              orderBy: { ordem: 'asc' },
              select: { id: true, ordem: true, nome: true },
            },
          },
        },
        lote: {
          select: {
            id: true,
            nome: true,
            preco: true,
          },
        },
        checkins: {
          where: { valido: true },
          orderBy: [{ diaEvento: 'asc' }, { createdAt: 'asc' }],
          select: {
            diaEvento: true,
            createdAt: true,
            pontoCheckin: {
              select: { id: true, ordem: true, nome: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return ingressos.map((ingresso) => {
      const isBatePonto =
        ingresso.evento.modoCheckin === ModoCheckinEvento.BATE_PONTO
      const totalBips = isBatePonto
        ? ingresso.evento.checkinDias * ingresso.evento.pontosCheckin.length
        : 0
      const checkinsValidos = ingresso.checkins.filter(
        (c) => c.diaEvento && c.pontoCheckin,
      )
      const presencaCompleta =
        isBatePonto && ingresso.status === StatusIngresso.UTILIZADO

      return {
        id: ingresso.id,
        status: ingresso.status,
        participanteNome: ingresso.participanteNome,
        participanteCpf: ingresso.participanteCpf,
        participanteTelefone: ingresso.participanteTelefone,
        qrCodeUrl: ingresso.qrCodeUrl,
        utilizadoEm: ingresso.utilizadoEm?.toISOString() ?? null,
        createdAt: ingresso.createdAt.toISOString(),
        presencaCompleta,
        progressoCheckin: isBatePonto
          ? {
              concluidos: checkinsValidos.length,
              total: totalBips,
            }
          : null,
        evento: {
          ...ingresso.evento,
          dataInicio: ingresso.evento.dataInicio.toISOString(),
        },
        lote: ingresso.lote,
        qrCodeVisivel: isBatePonto
          ? ingresso.status === StatusIngresso.VALIDO
          : ingresso.status === StatusIngresso.VALIDO,
      }
    })
  }
}
