import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import { getCursoVideoMaxBytes } from './cursos-media.config'
import { CursosService } from './cursos.service'
import {
  AtualizarAulaDto,
  AtualizarCursoDto,
  AtualizarModuloDto,
  CriarAulaDto,
  CriarCursoDto,
  CriarModuloDto,
  RegistrarProgressoAulaDto,
  SalvarPermissoesCursoDto,
} from './dto/cursos.dto'

@Controller('cursos')
@UseGuards(JwtAuthGuard)
export class CursosController {
  constructor(private readonly cursosService: CursosService) {}

  @Get('meus')
  listarMeus(@CurrentUser() user: AuthenticatedUser) {
    return this.cursosService.listarMeusCursos(user.id)
  }

  @Get('admin')
  listarAdmin(@CurrentUser() user: AuthenticatedUser) {
    return this.cursosService.listarAdmin(user.id)
  }

  @Post('admin')
  criar(@CurrentUser() user: AuthenticatedUser, @Body() dto: CriarCursoDto) {
    return this.cursosService.criarCurso(user.id, dto)
  }

  @Get('admin/permissoes/usuarios')
  listarUsuariosPermissoes(@CurrentUser() user: AuthenticatedUser) {
    return this.cursosService.listarUsuariosPermissoes(user.id)
  }

  @Get('admin/permissoes/:usuarioId')
  obterPermissoes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId') usuarioId: string,
  ) {
    return this.cursosService.obterPermissoesUsuario(user.id, usuarioId)
  }

  @Put('admin/permissoes/:usuarioId')
  salvarPermissoes(
    @CurrentUser() user: AuthenticatedUser,
    @Param('usuarioId') usuarioId: string,
    @Body() dto: SalvarPermissoesCursoDto,
  ) {
    return this.cursosService.salvarPermissoesUsuario(user.id, usuarioId, dto)
  }

  @Get('admin/:id')
  obterAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.cursosService.obterCursoAdmin(user.id, id)
  }

  @Patch('admin/:id')
  atualizar(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AtualizarCursoDto,
  ) {
    return this.cursosService.atualizarCurso(user.id, id, dto)
  }

  @Delete('admin/:id')
  remover(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.cursosService.removerCurso(user.id, id)
  }

  @Post('admin/:cursoId/modulos')
  criarModulo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('cursoId') cursoId: string,
    @Body() dto: CriarModuloDto,
  ) {
    return this.cursosService.criarModulo(user.id, cursoId, dto)
  }

  @Patch('admin/modulos/:moduloId')
  atualizarModulo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduloId') moduloId: string,
    @Body() dto: AtualizarModuloDto,
  ) {
    return this.cursosService.atualizarModulo(user.id, moduloId, dto)
  }

  @Delete('admin/modulos/:moduloId')
  removerModulo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduloId') moduloId: string,
  ) {
    return this.cursosService.removerModulo(user.id, moduloId)
  }

  @Post('admin/modulos/:moduloId/aulas')
  criarAula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduloId') moduloId: string,
    @Body() dto: CriarAulaDto,
  ) {
    return this.cursosService.criarAula(user.id, moduloId, dto)
  }

  @Post('admin/modulos/:moduloId/aulas/video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: getCursoVideoMaxBytes() },
    }),
  )
  criarAulaComVideo(
    @CurrentUser() user: AuthenticatedUser,
    @Param('moduloId') moduloId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('titulo') titulo: string,
  ) {
    return this.cursosService.criarAulaComVideo(user.id, moduloId, titulo, file)
  }

  @Post('admin/aulas/:aulaId/video')
  @UseInterceptors(
    FileInterceptor('video', {
      limits: { fileSize: getCursoVideoMaxBytes() },
    }),
  )
  uploadVideoAula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('aulaId') aulaId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cursosService.uploadVideoAula(user.id, aulaId, file)
  }

  @Patch('admin/aulas/:aulaId')
  atualizarAula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('aulaId') aulaId: string,
    @Body() dto: AtualizarAulaDto,
  ) {
    return this.cursosService.atualizarAula(user.id, aulaId, dto)
  }

  @Delete('admin/aulas/:aulaId')
  removerAula(
    @CurrentUser() user: AuthenticatedUser,
    @Param('aulaId') aulaId: string,
  ) {
    return this.cursosService.removerAula(user.id, aulaId)
  }

  @Get(':id')
  obterAluno(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.cursosService.obterCursoAluno(user.id, id)
  }

  @Post('aulas/:aulaId/progresso')
  registrarProgresso(
    @CurrentUser() user: AuthenticatedUser,
    @Param('aulaId') aulaId: string,
    @Body() dto: RegistrarProgressoAulaDto,
  ) {
    return this.cursosService.registrarProgressoAula(user.id, aulaId, dto)
  }
}
