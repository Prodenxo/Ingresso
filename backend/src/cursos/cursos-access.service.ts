import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { StatusCurso } from '@prisma/client'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CursosAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly empresaAccess: EmpresaAccessService,
  ) {}

  async assertAdminCursos(usuarioId: string): Promise<string> {
    return this.empresaAccess.assertAdministradorEmpresa(usuarioId)
  }

  async assertAcessoCurso(
    usuarioId: string,
    cursoId: string,
    options?: { apenasPublicado?: boolean },
  ): Promise<{ empresaId: string; cursoId: string }> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { id: true, empresaId: true, status: true },
    })

    if (!curso) {
      throw new NotFoundException('Curso não encontrado')
    }

    if (options?.apenasPublicado && curso.status !== StatusCurso.PUBLICADO) {
      throw new NotFoundException('Curso não encontrado')
    }

    const vinculo = await this.prisma.usuarioEmpresa.findUnique({
      where: {
        empresaId_usuarioId: {
          empresaId: curso.empresaId,
          usuarioId,
        },
      },
      select: { acessoCursos: true },
    })

    if (!vinculo?.acessoCursos) {
      throw new ForbiddenException('Você não tem acesso ao módulo de cursos')
    }

    const liberado = await this.prisma.cursoUsuarioAcesso.findUnique({
      where: {
        cursoId_usuarioId: {
          cursoId: curso.id,
          usuarioId,
        },
      },
    })

    if (!liberado) {
      throw new ForbiddenException('Este curso não foi liberado para você')
    }

    return { empresaId: curso.empresaId, cursoId: curso.id }
  }

  async usuarioTemAlgumAcessoCursos(usuarioId: string): Promise<boolean> {
    const vinculo = await this.prisma.usuarioEmpresa.findFirst({
      where: {
        usuarioId,
        acessoCursos: true,
      },
      select: { id: true },
    })

    return Boolean(vinculo)
  }
}
