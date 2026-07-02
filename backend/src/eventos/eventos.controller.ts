import {

  Body,

  Controller,

  Delete,

  Get,

  Param,

  Patch,

  Post,

  UploadedFile,

  UseGuards,

  UseInterceptors,

} from '@nestjs/common'

import { FileInterceptor } from '@nestjs/platform-express'

import { CurrentUser } from '../auth/decorators/current-user.decorator'

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'

import { CreateEventoDto } from './dto/create-evento.dto'

import { CreateLoteDto } from './dto/create-lote.dto'

import { ConfigCheckinEventoDto } from './dto/config-checkin-evento.dto'
import { UpdateEventoDto } from './dto/update-evento.dto'

import { EventosService } from './eventos.service'
import { getFlyerMaxBytes } from './eventos-media.config'

@Controller('eventos')

export class EventosController {

  constructor(private readonly eventosService: EventosService) {}



  @UseGuards(JwtAuthGuard)
  @Get('disponiveis')
  findDisponiveis(@CurrentUser() user: AuthenticatedUser) {
    return this.eventosService.findDisponiveis(user.id)
  }



  @UseGuards(JwtAuthGuard)

  @Get('admin')

  findAllAdmin(@CurrentUser() user: AuthenticatedUser) {

    return this.eventosService.findAllAdmin(user.id)

  }



  @UseGuards(JwtAuthGuard)

  @Post()

  create(

    @CurrentUser() user: AuthenticatedUser,

    @Body() dto: CreateEventoDto,

  ) {

    return this.eventosService.create(user.id, dto)

  }



  @UseGuards(JwtAuthGuard)

  @Get(':id')

  findOne(

    @Param('id') id: string,

    @CurrentUser() user: AuthenticatedUser,

  ) {

    return this.eventosService.findOneAdmin(id, user.id)

  }



  @UseGuards(JwtAuthGuard)

  @Patch(':id')

  update(

    @Param('id') id: string,

    @CurrentUser() user: AuthenticatedUser,

    @Body() dto: UpdateEventoDto,

  ) {

    return this.eventosService.update(id, user.id, dto)

  }



  @UseGuards(JwtAuthGuard)

  @Patch(':id/checkin-config')

  configurarCheckin(

    @Param('id') id: string,

    @CurrentUser() user: AuthenticatedUser,

    @Body() dto: ConfigCheckinEventoDto,

  ) {

    return this.eventosService.configurarCheckin(id, user.id, dto)

  }



  @UseGuards(JwtAuthGuard)

  @Post(':id/flyer')

  @UseInterceptors(

    FileInterceptor('flyer', {

      limits: { fileSize: getFlyerMaxBytes() },

    }),

  )

  uploadFlyer(

    @Param('id') id: string,

    @CurrentUser() user: AuthenticatedUser,

    @UploadedFile() file: Express.Multer.File,

  ) {

    return this.eventosService.uploadFlyer(id, user.id, file)

  }



  @UseGuards(JwtAuthGuard)

  @Delete(':id/flyer')

  removeFlyer(

    @Param('id') id: string,

    @CurrentUser() user: AuthenticatedUser,

  ) {

    return this.eventosService.removeFlyer(id, user.id)

  }



  @UseGuards(JwtAuthGuard)

  @Post(':id/publicar')

  publicar(

    @Param('id') id: string,

    @CurrentUser() user: AuthenticatedUser,

  ) {

    return this.eventosService.publicar(id, user.id)

  }



  @UseGuards(JwtAuthGuard)

  @Delete(':id')

  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {

    return this.eventosService.remove(id, user.id)

  }



  @UseGuards(JwtAuthGuard)

  @Post(':id/lotes')

  createLote(

    @Param('id') id: string,

    @CurrentUser() user: AuthenticatedUser,

    @Body() dto: CreateLoteDto,

  ) {

    return this.eventosService.createLote(id, user.id, dto)

  }



  @UseGuards(JwtAuthGuard)

  @Delete(':id/lotes/:loteId')

  removeLote(

    @Param('id') id: string,

    @Param('loteId') loteId: string,

    @CurrentUser() user: AuthenticatedUser,

  ) {

    return this.eventosService.removeLote(id, loteId, user.id)

  }

}


