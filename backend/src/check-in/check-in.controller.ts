import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import { CheckInService } from './check-in.service'
import { ValidarCheckinDto } from './dto/validar-checkin.dto'

@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @UseGuards(JwtAuthGuard)
  @Get('eventos')
  listarEventos(@CurrentUser() user: AuthenticatedUser) {
    return this.checkInService.listarEventos(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post('validar')
  validar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ValidarCheckinDto,
  ) {
    return this.checkInService.validar(user.id, dto)
  }
}
