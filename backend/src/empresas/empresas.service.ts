import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(usuarioId: string) {
    const memberships = await this.prisma.usuarioEmpresa.findMany({
      where: { usuarioId },
      select: {
        papel: true,
        createdAt: true,
        empresa: {
          select: {
            id: true,
            nome: true,
            razaoSocial: true,
            cnpj: true,
            corPrimaria: true,
            logoUrl: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return memberships.map(({ empresa, papel, createdAt }) => ({
      ...empresa,
      papel,
      vinculoEm: createdAt,
    }))
  }
}
