import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class EmpresasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.empresa.findMany({
      select: {
        id: true,
        nome: true,
        cnpj: true,
        corPrimaria: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
