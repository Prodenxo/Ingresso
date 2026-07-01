import { Injectable } from '@nestjs/common'
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

    return this.prisma.ingresso.findMany({
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
          },
        },
        lote: {
          select: {
            id: true,
            nome: true,
            preco: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
