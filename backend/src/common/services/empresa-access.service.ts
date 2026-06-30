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
    const empresaId = await this.resolveEmpresaId(usuarioId)
    const vinculo = await this.prisma.usuarioEmpresa.findFirst({
      where: { usuarioId, empresaId },
      select: { papel: true },
    })

    if (
      !vinculo ||
      (vinculo.papel !== 'ADMINISTRADOR' && vinculo.papel !== 'FINANCEIRO')
    ) {
      throw new ForbiddenException(
        'Apenas administrador ou financeiro pode configurar pagamentos',
      )
    }

    return empresaId
  }
}
