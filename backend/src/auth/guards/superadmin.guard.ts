import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { TipoConta } from '@prisma/client'
import { PrismaService } from '../../prisma/prisma.service'
import type { AuthenticatedUser } from '../types/jwt-payload.type'

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>()
    const userId = request.user?.id

    if (!userId) {
      throw new ForbiddenException('Acesso restrito a super administradores')
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { tipoConta: true },
    })

    if (usuario?.tipoConta !== TipoConta.SUPERADMIN) {
      throw new ForbiddenException('Acesso restrito a super administradores')
    }

    return true
  }
}
