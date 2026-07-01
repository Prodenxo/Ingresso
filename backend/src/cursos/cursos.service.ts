import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { StatusCurso } from '@prisma/client'
import { TipoCursoAula } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CursosAccessService } from './cursos-access.service'
import { CursosMediaService } from './cursos-media.service'
import type {
  AtualizarAulaDto,
  AtualizarCursoDto,
  AtualizarModuloDto,
  CriarAulaDto,
  CriarCursoDto,
  CriarModuloDto,
  RegistrarProgressoAulaDto,
  SalvarPermissoesCursoDto,
} from './dto/cursos.dto'

@Injectable()
export class CursosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cursosAccess: CursosAccessService,
    private readonly cursosMedia: CursosMediaService,
  ) {}

  async listarAdmin(usuarioId: string) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)

    const cursos = await this.prisma.curso.findMany({
      where: { empresaId },
      orderBy: [{ ordem: 'asc' }, { createdAt: 'desc' }],
      include: {
        _count: { select: { modulos: true, acessos: true } },
      },
    })

    return cursos.map((curso) => ({
      id: curso.id,
      titulo: curso.titulo,
      descricao: curso.descricao,
      capaUrl: curso.capaUrl,
      status: curso.status,
      ordem: curso.ordem,
      totalModulos: curso._count.modulos,
      totalAlunos: curso._count.acessos,
      createdAt: curso.createdAt.toISOString(),
    }))
  }

  async criarCurso(usuarioId: string, dto: CriarCursoDto) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)

    const curso = await this.prisma.curso.create({
      data: {
        empresaId,
        titulo: dto.titulo.trim(),
        descricao: dto.descricao?.trim() || null,
        capaUrl: dto.capaUrl?.trim() || null,
        status: dto.status ?? StatusCurso.RASCUNHO,
        ordem: dto.ordem ?? 0,
      },
    })

    return { id: curso.id }
  }

  async atualizarCurso(usuarioId: string, cursoId: string, dto: AtualizarCursoDto) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    await this.assertCursoEmpresa(cursoId, empresaId)

    await this.prisma.curso.update({
      where: { id: cursoId },
      data: {
        titulo: dto.titulo?.trim(),
        descricao: dto.descricao?.trim(),
        capaUrl: dto.capaUrl?.trim(),
        status: dto.status,
        ordem: dto.ordem,
      },
    })

    return { message: 'Curso atualizado' }
  }

  async removerCurso(usuarioId: string, cursoId: string) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    await this.assertCursoEmpresa(cursoId, empresaId)

    await this.prisma.curso.delete({ where: { id: cursoId } })

    return { message: 'Curso removido' }
  }

  async obterCursoAdmin(usuarioId: string, cursoId: string) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)

    const curso = await this.prisma.curso.findFirst({
      where: { id: cursoId, empresaId },
      include: {
        modulos: {
          orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
          include: {
            aulas: {
              orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
    })

    if (!curso) {
      throw new NotFoundException('Curso não encontrado')
    }

    return this.mapCursoDetalhe(curso)
  }

  async criarModulo(usuarioId: string, cursoId: string, dto: CriarModuloDto) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    await this.assertCursoEmpresa(cursoId, empresaId)

    const modulo = await this.prisma.cursoModulo.create({
      data: {
        empresaId,
        cursoId,
        titulo: dto.titulo.trim(),
        ordem: dto.ordem ?? 0,
      },
    })

    return { id: modulo.id }
  }

  async atualizarModulo(
    usuarioId: string,
    moduloId: string,
    dto: AtualizarModuloDto,
  ) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    await this.assertModuloEmpresa(moduloId, empresaId)

    await this.prisma.cursoModulo.update({
      where: { id: moduloId },
      data: {
        titulo: dto.titulo?.trim(),
        ordem: dto.ordem,
      },
    })

    return { message: 'Módulo atualizado' }
  }

  async removerModulo(usuarioId: string, moduloId: string) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    await this.assertModuloEmpresa(moduloId, empresaId)

    await this.prisma.cursoModulo.delete({ where: { id: moduloId } })

    return { message: 'Módulo removido' }
  }

  async criarAula(usuarioId: string, moduloId: string, dto: CriarAulaDto) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    await this.assertModuloEmpresa(moduloId, empresaId)
    this.validarConteudoAula(dto.tipo, dto.conteudoUrl, dto.conteudoTexto)

    const aula = await this.prisma.cursoAula.create({
      data: {
        empresaId,
        moduloId,
        titulo: dto.titulo.trim(),
        tipo: dto.tipo,
        conteudoUrl: dto.conteudoUrl?.trim() || null,
        conteudoTexto: dto.conteudoTexto?.trim() || null,
        duracaoMinutos: dto.duracaoMinutos ?? null,
        ordem: dto.ordem ?? 0,
      },
    })

    return { id: aula.id }
  }

  async criarAulaComVideo(
    usuarioId: string,
    moduloId: string,
    titulo: string,
    file: Express.Multer.File,
  ) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    await this.assertModuloEmpresa(moduloId, empresaId)

    const tituloLimpo = titulo.trim()
    if (tituloLimpo.length < 2) {
      throw new BadRequestException('Título da aula é obrigatório')
    }

    const conteudoUrl = await this.cursosMedia.saveVideo(file)

    const aula = await this.prisma.cursoAula.create({
      data: {
        empresaId,
        moduloId,
        titulo: tituloLimpo,
        tipo: TipoCursoAula.VIDEO,
        conteudoUrl,
        ordem: 0,
      },
    })

    return { id: aula.id, conteudoUrl }
  }

  async uploadVideoAula(
    usuarioId: string,
    aulaId: string,
    file: Express.Multer.File,
  ) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    const aula = await this.assertAulaEmpresa(aulaId, empresaId)

    if (aula.tipo !== TipoCursoAula.VIDEO) {
      throw new BadRequestException('Somente aulas de vídeo aceitam upload')
    }

    const conteudoUrl = await this.cursosMedia.saveVideo(file, aula.conteudoUrl)

    await this.prisma.cursoAula.update({
      where: { id: aulaId },
      data: { conteudoUrl },
    })

    return { conteudoUrl }
  }

  async atualizarAula(usuarioId: string, aulaId: string, dto: AtualizarAulaDto) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    const aula = await this.assertAulaEmpresa(aulaId, empresaId)

    const tipo = dto.tipo ?? aula.tipo
    this.validarConteudoAula(
      tipo,
      dto.conteudoUrl ?? aula.conteudoUrl,
      dto.conteudoTexto ?? aula.conteudoTexto,
    )

    await this.prisma.cursoAula.update({
      where: { id: aulaId },
      data: {
        titulo: dto.titulo?.trim(),
        tipo: dto.tipo,
        conteudoUrl: dto.conteudoUrl?.trim(),
        conteudoTexto: dto.conteudoTexto?.trim(),
        duracaoMinutos: dto.duracaoMinutos,
        ordem: dto.ordem,
      },
    })

    return { message: 'Aula atualizada' }
  }

  async removerAula(usuarioId: string, aulaId: string) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)
    const aula = await this.assertAulaEmpresa(aulaId, empresaId)

    this.cursosMedia.removeByPublicUrl(aula.conteudoUrl)

    await this.prisma.cursoAula.delete({ where: { id: aulaId } })

    return { message: 'Aula removida' }
  }

  async listarUsuariosPermissoes(usuarioId: string) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)

    const vinculos = await this.prisma.usuarioEmpresa.findMany({
      where: { empresaId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        papel: true,
        acessoCursos: true,
        usuario: {
          select: { id: true, nome: true, email: true },
        },
      },
    })

    const acessos = await this.prisma.cursoUsuarioAcesso.groupBy({
      by: ['usuarioId'],
      where: { empresaId },
      _count: { cursoId: true },
    })

    const countMap = new Map(
      acessos.map((item) => [item.usuarioId, item._count.cursoId]),
    )

    return vinculos.map((vinculo) => ({
      vinculoId: vinculo.id,
      usuarioId: vinculo.usuario.id,
      nome: vinculo.usuario.nome,
      email: vinculo.usuario.email,
      papel: vinculo.papel,
      acessoCursos: vinculo.acessoCursos,
      totalCursosLiberados: countMap.get(vinculo.usuario.id) ?? 0,
    }))
  }

  async obterPermissoesUsuario(usuarioId: string, alvoUsuarioId: string) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)

    const vinculo = await this.prisma.usuarioEmpresa.findUnique({
      where: {
        empresaId_usuarioId: {
          empresaId,
          usuarioId: alvoUsuarioId,
        },
      },
    })

    if (!vinculo) {
      throw new NotFoundException('Usuário não vinculado à empresa')
    }

    const cursos = await this.prisma.curso.findMany({
      where: { empresaId },
      orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
      select: { id: true, titulo: true, status: true },
    })

    const liberados = await this.prisma.cursoUsuarioAcesso.findMany({
      where: { empresaId, usuarioId: alvoUsuarioId },
      select: { cursoId: true },
    })

    const liberadosSet = new Set(liberados.map((item) => item.cursoId))

    return {
      usuarioId: alvoUsuarioId,
      acessoCursos: vinculo.acessoCursos,
      cursos: cursos.map((curso) => ({
        id: curso.id,
        titulo: curso.titulo,
        status: curso.status,
        liberado: liberadosSet.has(curso.id),
      })),
    }
  }

  async salvarPermissoesUsuario(
    usuarioId: string,
    alvoUsuarioId: string,
    dto: SalvarPermissoesCursoDto,
  ) {
    const empresaId = await this.cursosAccess.assertAdminCursos(usuarioId)

    const vinculo = await this.prisma.usuarioEmpresa.findUnique({
      where: {
        empresaId_usuarioId: {
          empresaId,
          usuarioId: alvoUsuarioId,
        },
      },
    })

    if (!vinculo) {
      throw new NotFoundException('Usuário não vinculado à empresa')
    }

    const cursoIdsUnicos = [...new Set(dto.cursoIds)]

    if (cursoIdsUnicos.length > 0) {
      const cursosValidos = await this.prisma.curso.count({
        where: { empresaId, id: { in: cursoIdsUnicos } },
      })

      if (cursosValidos !== cursoIdsUnicos.length) {
        throw new BadRequestException('Um ou mais cursos são inválidos')
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.usuarioEmpresa.update({
        where: { id: vinculo.id },
        data: { acessoCursos: dto.acessoCursos },
      })

      await tx.cursoUsuarioAcesso.deleteMany({
        where: { empresaId, usuarioId: alvoUsuarioId },
      })

      if (dto.acessoCursos && cursoIdsUnicos.length > 0) {
        await tx.cursoUsuarioAcesso.createMany({
          data: cursoIdsUnicos.map((cursoId) => ({
            empresaId,
            cursoId,
            usuarioId: alvoUsuarioId,
          })),
        })
      }
    })

    return { message: 'Permissões salvas' }
  }

  async listarMeusCursos(usuarioId: string) {
    const vinculos = await this.prisma.usuarioEmpresa.findMany({
      where: { usuarioId, acessoCursos: true },
      select: { empresaId: true, empresa: { select: { nome: true } } },
    })

    if (vinculos.length === 0) {
      return []
    }

    const empresaIds = vinculos.map((v) => v.empresaId)
    const empresaNomeMap = new Map(
      vinculos.map((v) => [v.empresaId, v.empresa.nome]),
    )

    const cursos = await this.prisma.curso.findMany({
      where: {
        empresaId: { in: empresaIds },
        status: StatusCurso.PUBLICADO,
        acessos: { some: { usuarioId } },
      },
      orderBy: [{ ordem: 'asc' }, { titulo: 'asc' }],
      include: {
        modulos: {
          include: { _count: { select: { aulas: true } } },
        },
      },
    })

    const progressos = await this.prisma.cursoAulaProgresso.findMany({
      where: {
        usuarioId,
        concluida: true,
        aula: { modulo: { cursoId: { in: cursos.map((c) => c.id) } } },
      },
      select: { aula: { select: { modulo: { select: { cursoId: true } } } } },
    })

    const concluidasPorCurso = new Map<string, number>()

    for (const progresso of progressos) {
      const cursoId = progresso.aula.modulo.cursoId
      concluidasPorCurso.set(cursoId, (concluidasPorCurso.get(cursoId) ?? 0) + 1)
    }

    return cursos.map((curso) => {
      const totalAulas = curso.modulos.reduce(
        (acc, modulo) => acc + modulo._count.aulas,
        0,
      )
      const aulasConcluidas = concluidasPorCurso.get(curso.id) ?? 0

      return {
        id: curso.id,
        titulo: curso.titulo,
        descricao: curso.descricao,
        capaUrl: curso.capaUrl,
        empresaNome: empresaNomeMap.get(curso.empresaId) ?? '',
        totalModulos: curso.modulos.length,
        totalAulas,
        progressoPct:
          totalAulas > 0
            ? Math.round((aulasConcluidas / totalAulas) * 100)
            : 0,
      }
    })
  }

  async obterCursoAluno(usuarioId: string, cursoId: string) {
    await this.cursosAccess.assertAcessoCurso(usuarioId, cursoId, {
      apenasPublicado: true,
    })

    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      include: {
        modulos: {
          orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
          include: {
            aulas: {
              orderBy: [{ ordem: 'asc' }, { createdAt: 'asc' }],
            },
          },
        },
      },
    })

    if (!curso) {
      throw new NotFoundException('Curso não encontrado')
    }

    const aulaIds = curso.modulos.flatMap((m) => m.aulas.map((a) => a.id))

    const progressos = await this.prisma.cursoAulaProgresso.findMany({
      where: { usuarioId, aulaId: { in: aulaIds } },
    })

    const progressoMap = new Map(progressos.map((p) => [p.aulaId, p]))

    return {
      ...this.mapCursoDetalhe(curso),
      modulos: curso.modulos.map((modulo) => ({
        id: modulo.id,
        titulo: modulo.titulo,
        ordem: modulo.ordem,
        aulas: modulo.aulas.map((aula) => {
          const progresso = progressoMap.get(aula.id)

          return {
            id: aula.id,
            titulo: aula.titulo,
            tipo: aula.tipo,
            conteudoUrl: aula.conteudoUrl,
            conteudoTexto: aula.conteudoTexto,
            duracaoMinutos: aula.duracaoMinutos,
            ordem: aula.ordem,
            concluida: progresso?.concluida ?? false,
            progressoPct: progresso?.progressoPct ?? 0,
          }
        }),
      })),
    }
  }

  async registrarProgressoAula(
    usuarioId: string,
    aulaId: string,
    dto: RegistrarProgressoAulaDto,
  ) {
    const aula = await this.prisma.cursoAula.findUnique({
      where: { id: aulaId },
      include: { modulo: { select: { cursoId: true } } },
    })

    if (!aula) {
      throw new NotFoundException('Aula não encontrada')
    }

    await this.cursosAccess.assertAcessoCurso(usuarioId, aula.modulo.cursoId, {
      apenasPublicado: true,
    })

    const concluida = dto.concluida ?? false
    const progressoPct = concluida
      ? 100
      : Math.min(100, Math.max(0, dto.progressoPct ?? 0))

    await this.prisma.cursoAulaProgresso.upsert({
      where: {
        aulaId_usuarioId: { aulaId, usuarioId },
      },
      create: {
        empresaId: aula.empresaId,
        aulaId,
        usuarioId,
        concluida,
        progressoPct,
        concluidaEm: concluida ? new Date() : null,
      },
      update: {
        concluida,
        progressoPct,
        concluidaEm: concluida ? new Date() : null,
      },
    })

    return { message: 'Progresso salvo' }
  }

  private mapCursoDetalhe(curso: {
    id: string
    titulo: string
    descricao: string | null
    capaUrl: string | null
    status: StatusCurso
    ordem: number
    modulos: Array<{
      id: string
      titulo: string
      ordem: number
      aulas: Array<{
        id: string
        titulo: string
        tipo: string
        conteudoUrl: string | null
        conteudoTexto: string | null
        duracaoMinutos: number | null
        ordem: number
      }>
    }>
  }) {
    return {
      id: curso.id,
      titulo: curso.titulo,
      descricao: curso.descricao,
      capaUrl: curso.capaUrl,
      status: curso.status,
      ordem: curso.ordem,
      modulos: curso.modulos.map((modulo) => ({
        id: modulo.id,
        titulo: modulo.titulo,
        ordem: modulo.ordem,
        aulas: modulo.aulas.map((aula) => ({
          id: aula.id,
          titulo: aula.titulo,
          tipo: aula.tipo,
          conteudoUrl: aula.conteudoUrl,
          conteudoTexto: aula.conteudoTexto,
          duracaoMinutos: aula.duracaoMinutos,
          ordem: aula.ordem,
        })),
      })),
    }
  }

  private validarConteudoAula(
    tipo: string,
    conteudoUrl?: string | null,
    conteudoTexto?: string | null,
  ) {
    if (tipo === 'TEXTO' && !conteudoTexto?.trim()) {
      throw new BadRequestException('Aula de texto precisa de conteúdo')
    }

    if (tipo === 'VIDEO' && this.isUploadedVideoPath(conteudoUrl)) {
      return
    }

    if ((tipo === 'VIDEO' || tipo === 'PDF') && !conteudoUrl?.trim()) {
      throw new BadRequestException('Informe a URL do vídeo ou PDF')
    }
  }

  private isUploadedVideoPath(url?: string | null): boolean {
    return Boolean(url?.startsWith('/api/uploads/cursos/'))
  }

  private async assertCursoEmpresa(cursoId: string, empresaId: string) {
    const curso = await this.prisma.curso.findFirst({
      where: { id: cursoId, empresaId },
      select: { id: true },
    })

    if (!curso) {
      throw new NotFoundException('Curso não encontrado')
    }
  }

  private async assertModuloEmpresa(moduloId: string, empresaId: string) {
    const modulo = await this.prisma.cursoModulo.findFirst({
      where: { id: moduloId, empresaId },
      select: { id: true },
    })

    if (!modulo) {
      throw new NotFoundException('Módulo não encontrado')
    }
  }

  private async assertAulaEmpresa(aulaId: string, empresaId: string) {
    const aula = await this.prisma.cursoAula.findFirst({
      where: { id: aulaId, empresaId },
    })

    if (!aula) {
      throw new NotFoundException('Aula não encontrada')
    }

    return aula
  }
}
