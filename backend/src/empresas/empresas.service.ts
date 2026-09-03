import { ForbiddenException, Injectable } from '@nestjs/common'
import { TipoConta } from '@prisma/client'
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

  async findAllForSuperAdmin() {
    const empresas = await this.prisma.empresa.findMany({
      select: {
        id: true,
        nome: true,
        razaoSocial: true,
        cnpj: true,
        corPrimaria: true,
        logoUrl: true,
        createdAt: true,
        _count: {
          select: {
            eventos: true,
            usuarios: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    })

    return empresas.map(({ _count, ...empresa }) => ({
      ...empresa,
      totalEventos: _count.eventos,
      totalMembros: _count.usuarios,
    }))
  }

  async assertSuperAdmin(usuarioId: string): Promise<void> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { tipoConta: true },
    })

    if (usuario?.tipoConta !== TipoConta.SUPERADMIN) {
      throw new ForbiddenException('Acesso restrito a super administradores')
    }
  }
}
