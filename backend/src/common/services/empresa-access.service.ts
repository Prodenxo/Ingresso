import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { TipoConta } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class EmpresaAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveEmpresaId(usuarioId: string): Promise<string> {
    const vinculo = await this.prisma.usuarioEmpresa.findFirst({
      where: { usuarioId },
      orderBy: { createdAt: 'asc' },
    })

    if (vinculo) {
      return vinculo.empresaId
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { tipoConta: true },
    })

    if (usuario?.tipoConta === TipoConta.SUPERADMIN) {
      const primeiraEmpresa = await this.prisma.empresa.findFirst({
        orderBy: { createdAt: 'asc' },
      })

      if (primeiraEmpresa) {
        return primeiraEmpresa.id
      }
    }

    throw new ForbiddenException(
      'Nenhuma empresa vinculada. Cadastre-se como empresa para gerenciar eventos.',
    )
  }

  async assertEventoOwnership(eventoId: string, empresaId: string): Promise<void> {
    const evento = await this.prisma.evento.findFirst({
      where: { id: eventoId, empresaId },
      select: { id: true },
    })

    if (!evento) {
      throw new NotFoundException('Evento não encontrado')
    }
  }

  async assertPagamentoConfigAccess(usuarioId: string): Promise<string> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { tipoConta: true },
    })

    if (usuario?.tipoConta === TipoConta.SUPERADMIN) {
      const primeiraEmpresa = await this.prisma.empresa.findFirst({
        orderBy: { createdAt: 'asc' },
      })

      if (primeiraEmpresa) {
        return primeiraEmpresa.id
      }

      throw new ForbiddenException('Nenhuma empresa cadastrada no sistema')
    }

    const vinculoAdmin = await this.prisma.usuarioEmpresa.findFirst({
      where: {
        usuarioId,
        papel: { in: ['ADMINISTRADOR', 'FINANCEIRO'] },
      },
      orderBy: { createdAt: 'asc' },
    })

    if (!vinculoAdmin) {
      throw new ForbiddenException(
        'Apenas administrador ou financeiro pode configurar pagamentos',
      )
    }

    return vinculoAdmin.empresaId
  }

  async getEmpresasVinculadasIds(usuarioId: string): Promise<string[]> {
    const vinculos = await this.prisma.usuarioEmpresa.findMany({
      where: { usuarioId },
      select: { empresaId: true },
    })

    return vinculos.map((vinculo) => vinculo.empresaId)
  }

  async assertVinculoEmpresa(
    usuarioId: string,
    empresaId: string,
  ): Promise<void> {
    const vinculo = await this.prisma.usuarioEmpresa.findUnique({
      where: {
        empresaId_usuarioId: {
          empresaId,
          usuarioId,
        },
      },
    })

    if (!vinculo) {
      throw new ForbiddenException(
        'Você precisa estar vinculado à empresa para acessar este conteúdo',
      )
    }
  }

  async assertCheckinAccess(usuarioId: string): Promise<string> {
    const empresaId = await this.resolveEmpresaId(usuarioId)

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { tipoConta: true },
    })

    if (usuario?.tipoConta === TipoConta.SUPERADMIN) {
      return empresaId
    }

    const vinculo = await this.prisma.usuarioEmpresa.findFirst({
      where: { usuarioId, empresaId },
      select: { papel: true },
    })

    const papeisPermitidos = ['ADMINISTRADOR', 'OPERADOR', 'CHECKIN'] as const

    if (!vinculo || !papeisPermitidos.includes(vinculo.papel as typeof papeisPermitidos[number])) {
      throw new ForbiddenException(
        'Você não tem permissão para realizar check-in',
      )
    }

    return empresaId
  }

  async assertAdministradorEmpresa(usuarioId: string): Promise<string> {
    const empresaId = await this.resolveEmpresaId(usuarioId)
    const vinculo = await this.prisma.usuarioEmpresa.findFirst({
      where: { usuarioId, empresaId },
      select: { papel: true },
    })

    if (!vinculo || vinculo.papel !== 'ADMINISTRADOR') {
      throw new ForbiddenException(
        'Apenas administradores podem gerenciar convites de membros',
      )
    }

    return empresaId
  }
}
