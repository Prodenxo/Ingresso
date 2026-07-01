import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import { VincularMembroDto } from './dto/vincular-membro.dto'
import { MembrosService } from './membros.service'

@Controller('membros')
export class MembrosController {
  constructor(private readonly membrosService: MembrosService) {}

  @Get('convite/:slug')
  obterConvite(@Param('slug') slug: string) {
    return this.membrosService.obterConvitePublico(slug)
  }

  @UseGuards(JwtAuthGuard)
  @Post('vincular')
  vincular(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VincularMembroDto,
  ) {
    return this.membrosService.vincular(user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  listarMembros(@CurrentUser() user: AuthenticatedUser) {
    return this.membrosService.listarMembros(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':vinculoId')
  removerMembro(
    @CurrentUser() user: AuthenticatedUser,
    @Param('vinculoId') vinculoId: string,
  ) {
    return this.membrosService.removerMembro(user.id, vinculoId)
  }

  @UseGuards(JwtAuthGuard)
  @Get('convite-config')
  obterConfigConvite(@CurrentUser() user: AuthenticatedUser) {
    return this.membrosService.obterConfigConvite(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('convite/regenerar-codigo')
  regenerarCodigo(@CurrentUser() user: AuthenticatedUser) {
    return this.membrosService.regenerarCodigo(user.id)
  }
}
