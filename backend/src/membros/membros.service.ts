import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PapelUsuario } from '@prisma/client'
import { gerarCodigoConvite } from '../common/utils/codigo-convite'
import { buildUniqueSlug } from '../common/utils/slug'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PrismaService } from '../prisma/prisma.service'
import { VincularMembroDto } from './dto/vincular-membro.dto'

@Injectable()
export class MembrosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
  ) {}

  async obterConvitePublico(slug: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { slugMembro: slug.trim().toLowerCase() },
      select: {
        id: true,
        nome: true,
        logoUrl: true,
        corPrimaria: true,
        slugMembro: true,
      },
    })

    if (!empresa?.slugMembro) {
      throw new NotFoundException('Convite não encontrado')
    }

    return empresa
  }

  async vincular(usuarioId: string, dto: VincularMembroDto) {
    const slug = dto.slug?.trim().toLowerCase()
    const codigo = dto.codigo?.trim().toUpperCase()

    if (!slug && !codigo) {
      throw new BadRequestException('Informe o link ou o código de convite')
    }

    const empresa = slug
      ? await this.prisma.empresa.findFirst({ where: { slugMembro: slug } })
      : await this.prisma.empresa.findFirst({ where: { codigoConvite: codigo } })

    if (!empresa) {
      throw new NotFoundException('Convite inválido ou expirado')
    }

    const existente = await this.prisma.usuarioEmpresa.findUnique({
      where: {
        empresaId_usuarioId: {
          empresaId: empresa.id,
          usuarioId,
        },
      },
    })

    if (existente) {
      return {
        message: 'Você já está vinculado a esta empresa',
        empresa: {
          id: empresa.id,
          nome: empresa.nome,
          slugMembro: empresa.slugMembro,
        },
        jaVinculado: true,
      }
    }

    await this.prisma.usuarioEmpresa.create({
      data: {
        empresaId: empresa.id,
        usuarioId,
        papel: PapelUsuario.MEMBRO,
        permissoes: [],
      },
    })

    return {
      message: 'Vinculado com sucesso',
      empresa: {
        id: empresa.id,
        nome: empresa.nome,
        slugMembro: empresa.slugMembro,
      },
      jaVinculado: false,
    }
  }

  async listarMembros(usuarioId: string) {
    const empresaId = await this.empresaAccess.assertAdministradorEmpresa(
      usuarioId,
    )

    const vinculos = await this.prisma.usuarioEmpresa.findMany({
      where: {
        empresaId,
        papel: PapelUsuario.MEMBRO,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        createdAt: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    })

    return vinculos.map(({ id, createdAt, usuario }) => ({
      id,
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      vinculadoEm: createdAt.toISOString(),
    }))
  }

  async removerMembro(usuarioId: string, vinculoId: string) {
    const empresaId = await this.empresaAccess.assertAdministradorEmpresa(
      usuarioId,
    )

    const vinculo = await this.prisma.usuarioEmpresa.findFirst({
      where: {
        id: vinculoId,
        empresaId,
        papel: PapelUsuario.MEMBRO,
      },
    })

    if (!vinculo) {
      throw new NotFoundException('Membro não encontrado')
    }

    await this.prisma.usuarioEmpresa.delete({
      where: { id: vinculoId },
    })

    return { message: 'Vínculo removido com sucesso' }
  }

  async obterConfigConvite(usuarioId: string) {
    const empresaId = await this.empresaAccess.assertAdministradorEmpresa(
      usuarioId,
    )
    const convite = await this.ensureConviteEmpresa(empresaId)

    return {
      slugMembro: convite.slugMembro,
      codigoConvite: convite.codigoConvite,
    }
  }

  async regenerarCodigo(usuarioId: string) {
    const empresaId = await this.empresaAccess.assertAdministradorEmpresa(
      usuarioId,
    )

    const codigoConvite = await this.gerarCodigoUnico()

    const empresa = await this.prisma.empresa.update({
      where: { id: empresaId },
      data: { codigoConvite },
      select: {
        slugMembro: true,
        codigoConvite: true,
      },
    })

    return {
      slugMembro: empresa.slugMembro,
      codigoConvite: empresa.codigoConvite,
    }
  }

  async ensureConviteEmpresa(empresaId: string) {
    const empresa = await this.prisma.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        nome: true,
        slugMembro: true,
        codigoConvite: true,
      },
    })

    if (!empresa) {
      throw new NotFoundException('Empresa não encontrada')
    }

    if (empresa.slugMembro && empresa.codigoConvite) {
      return empresa
    }

    const slugMembro =
      empresa.slugMembro ??
      (await buildUniqueSlug(empresa.nome, async (candidate) => {
        const exists = await this.prisma.empresa.findFirst({
          where: { slugMembro: candidate },
        })
        return Boolean(exists)
      }))

    const codigoConvite = empresa.codigoConvite ?? (await this.gerarCodigoUnico())

    return this.prisma.empresa.update({
      where: { id: empresaId },
      data: { slugMembro, codigoConvite },
      select: {
        id: true,
        nome: true,
        slugMembro: true,
        codigoConvite: true,
      },
    })
  }

  private async gerarCodigoUnico(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const codigo = gerarCodigoConvite()
      const exists = await this.prisma.empresa.findFirst({
        where: { codigoConvite: codigo },
      })

      if (!exists) {
        return codigo
      }
    }

    throw new ConflictException('Não foi possível gerar código de convite')
  }
}
