import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import { IngressosService } from './ingressos.service'

@Controller('ingressos')
export class IngressosController {
  constructor(private readonly ingressosService: IngressosService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.ingressosService.findByParticipanteEmail(user.email)
  }
}
