import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../../prisma/prisma.service'
import type { AuthenticatedUser, JwtPayload } from '../types/jwt-payload.type'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('JWT_SECRET')

    if (!secret) {
      throw new Error('JWT_SECRET não configurado')
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    })
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, ativo: true },
    })

    if (!usuario?.ativo) {
      throw new UnauthorizedException('Usuário inválido ou inativo')
    }

    return {
      id: usuario.id,
      email: usuario.email,
    }
  }
}
