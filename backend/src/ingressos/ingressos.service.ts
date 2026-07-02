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

    return ingressos.map((ingresso) => ({
      ...ingresso,
      createdAt: ingresso.createdAt.toISOString(),
      utilizadoEm: ingresso.utilizadoEm?.toISOString() ?? null,
      evento: {
        ...ingresso.evento,
        dataInicio: ingresso.evento.dataInicio.toISOString(),
      },
      checkins:
        ingresso.evento.modoCheckin === ModoCheckinEvento.BATE_PONTO
          ? ingresso.checkins
              .filter((c) => c.diaEvento && c.pontoCheckin)
              .map((c) => ({
                diaEvento: c.diaEvento!,
                pontoNome: c.pontoCheckin!.nome,
                pontoOrdem: c.pontoCheckin!.ordem,
                realizadoEm: c.createdAt.toISOString(),
              }))
          : [],
      qrCodeVisivel:
        ingresso.evento.modoCheckin === ModoCheckinEvento.BATE_PONTO
          ? ingresso.status !== StatusIngresso.CANCELADO &&
            ingresso.status !== StatusIngresso.EXPIRADO
          : ingresso.status === StatusIngresso.VALIDO,
    }))
  }
}
