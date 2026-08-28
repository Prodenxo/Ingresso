import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import {
  CreateLinkIndicacaoDto,
  UpdateLinkIndicacaoDto,
} from './dto/create-link-indicacao.dto'
import { VincularLinkIndicacaoDto } from './dto/vincular-link-indicacao.dto'
import { LinksIndicacaoService } from './links-indicacao.service'

@Controller('links-indicacao')
export class LinksIndicacaoController {
  constructor(private readonly linksIndicacaoService: LinksIndicacaoService) {}

  @Get('publico/:slug')
  resolverPublico(@Param('slug') slug: string) {
    return this.linksIndicacaoService.resolverPublico(slug)
  }

  @UseGuards(JwtAuthGuard)
  @Post('vincular')
  vincularParticipante(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VincularLinkIndicacaoDto,
  ) {
    return this.linksIndicacaoService.vincularParticipante(dto.slug, user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('evento/:eventoId')
  listByEvento(
    @Param('eventoId') eventoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.linksIndicacaoService.listByEvento(eventoId, user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('evento/:eventoId/relatorio')
  getRelatorioEvento(
    @Param('eventoId') eventoId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.linksIndicacaoService.getRelatorioEvento(eventoId, user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('evento/:eventoId')
  create(
    @Param('eventoId') eventoId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLinkIndicacaoDto,
  ) {
    return this.linksIndicacaoService.create(eventoId, user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateLinkIndicacaoDto,
  ) {
    return this.linksIndicacaoService.update(id, user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.linksIndicacaoService.remove(id, user.id)
  }
}
