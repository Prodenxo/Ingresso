import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class IngressosService {
  constructor(private readonly prisma: PrismaService) {}

  async findByParticipanteEmail(email: string) {
    const participanteEmail = email.trim().toLowerCase()

    return this.prisma.ingresso.findMany({
      where: { participanteEmail },
      select: {
        id: true,
        status: true,
        participanteNome: true,
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
