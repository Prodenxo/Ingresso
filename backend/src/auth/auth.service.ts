import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { PapelUsuario, TipoConta } from '@prisma/client'
import type { StringValue } from 'ms'
import { hashPassword, verifyPassword } from '../common/crypto/password'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import type {
  AuthTokensResponse,
  AuthUserResponse,
} from './types/auth-response.type'
import type { JwtPayload } from './types/jwt-payload.type'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  getStatus() {
    return {
      module: 'auth',
      ready: true,
      message: 'Autenticação JWT ativa',
    }
  }

  async register(dto: RegisterDto): Promise<AuthTokensResponse> {
    if (dto.tipo === 'usuario') {
      return this.registerUsuario(dto)
    }

    return this.registerEmpresa(dto)
  }

  private async registerUsuario(dto: RegisterDto): Promise<AuthTokensResponse> {
    const email = dto.email.trim().toLowerCase()

    const emailExists = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado')
    }

    const senhaHash = await hashPassword(dto.senha)
    const tipoConta = await this.resolveTipoContaParaRegistro('usuario')

    const usuario = await this.prisma.usuario.create({
      data: {
        nome: dto.nome.trim(),
        email,
        senhaHash,
        telefone: dto.telefone?.trim(),
        tipoConta,
      },
    })

    return this.buildAuthResponse(usuario.id)
  }

  private async registerEmpresa(dto: RegisterDto): Promise<AuthTokensResponse> {
    const email = dto.email.trim().toLowerCase()
    const cnpj = dto.cnpj?.replace(/\D/g, '') ?? ''

    const [emailExists, cnpjExists] = await Promise.all([
      this.prisma.usuario.findUnique({ where: { email } }),
      this.prisma.empresa.findUnique({ where: { cnpj } }),
    ])

    if (emailExists) {
      throw new ConflictException('E-mail já cadastrado')
    }

    if (cnpjExists) {
      throw new ConflictException('CNPJ já cadastrado')
    }

    const senhaHash = await hashPassword(dto.senha)
    const tipoConta = await this.resolveTipoContaParaRegistro('empresa')

    const usuario = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.usuario.create({
        data: {
          nome: dto.nome.trim(),
          email,
          senhaHash,
          telefone: dto.telefone?.trim(),
          tipoConta,
        },
      })

      const empresa = await tx.empresa.create({
        data: {
          nome: dto.nomeEmpresa!.trim(),
          razaoSocial: dto.razaoSocial!.trim(),
          cnpj,
        },
      })

      await tx.usuarioEmpresa.create({
        data: {
          usuarioId: createdUser.id,
          empresaId: empresa.id,
          papel: PapelUsuario.ADMINISTRADOR,
          permissoes: [],
        },
      })

      await tx.configuracaoEmpresa.create({
        data: {
          empresaId: empresa.id,
          config: {},
        },
      })

      return createdUser
    })

    return this.buildAuthResponse(usuario.id)
  }

  async login(dto: LoginDto): Promise<AuthTokensResponse> {
    const email = dto.email.trim().toLowerCase()
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    })

    if (!usuario?.ativo) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    const senhaValida = await verifyPassword(dto.senha, usuario.senhaHash)

    if (!senhaValida) {
      throw new UnauthorizedException('Credenciais inválidas')
    }

    return this.buildAuthResponse(usuario.id)
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')

    if (!refreshSecret) {
      throw new UnauthorizedException('Refresh token indisponível')
    }

    let payload: JwtPayload

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      })
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado')
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { id: true, ativo: true },
    })

    if (!usuario?.ativo) {
      throw new UnauthorizedException('Usuário inválido ou inativo')
    }

    return this.buildAuthResponse(usuario.id)
  }

  async getMe(userId: string): Promise<AuthUserResponse> {
    await this.ensureBootstrapSuperAdmin()

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        tipoConta: true,
        ativo: true,
        empresas: {
          select: {
            papel: true,
            empresa: {
              select: {
                id: true,
                nome: true,
                cnpj: true,
              },
            },
          },
        },
      },
    })

    if (!usuario?.ativo) {
      throw new UnauthorizedException('Usuário inválido ou inativo')
    }

    return this.mapUserResponse(usuario)
  }

  private async buildAuthResponse(userId: string): Promise<AuthTokensResponse> {
    const user = await this.getMe(userId)
    const tokens = await this.generateTokens(user.id, user.email)

    return {
      ...tokens,
      user,
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload: JwtPayload = {
      sub: userId,
      email,
    }

    const expiresIn = (this.configService.get<string>('JWT_EXPIRES_IN') ??
      '15m') as StringValue
    const refreshExpiresIn = (this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
    ) ?? '7d') as StringValue
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET')

    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET não configurado')
    }

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ])

    return {
      accessToken,
      refreshToken,
      expiresIn,
    }
  }

  private async resolveTipoContaParaRegistro(
    tipo: RegisterDto['tipo'],
  ): Promise<TipoConta> {
    const totalUsuarios = await this.prisma.usuario.count()

    if (totalUsuarios === 0) {
      return TipoConta.SUPERADMIN
    }

    return tipo === 'empresa' ? TipoConta.ORGANIZADOR : TipoConta.PARTICIPANTE
  }

  private async ensureBootstrapSuperAdmin(): Promise<void> {
    const superAdminCount = await this.prisma.usuario.count({
      where: { tipoConta: TipoConta.SUPERADMIN },
    })

    if (superAdminCount > 0) {
      return
    }

    const firstUser = await this.prisma.usuario.findFirst({
      orderBy: { createdAt: 'asc' },
    })

    if (!firstUser) {
      return
    }

    await this.prisma.usuario.update({
      where: { id: firstUser.id },
      data: { tipoConta: TipoConta.SUPERADMIN },
    })
  }

  private mapUserResponse(usuario: {
    id: string
    nome: string
    email: string
    tipoConta: TipoConta
    empresas: Array<{
      papel: PapelUsuario
      empresa: {
        id: string
        nome: string
        cnpj: string
      }
    }>
  }): AuthUserResponse {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      tipoConta: usuario.tipoConta,
      empresas: usuario.empresas.map(({ empresa, papel }) => ({
        id: empresa.id,
        nome: empresa.nome,
        cnpj: empresa.cnpj,
        papel,
      })),
    }
  }
}
