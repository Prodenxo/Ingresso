import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('overview')
  getOverview(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getOverview(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('controle-entrada')
  getControleEntrada(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getControleEntrada(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Get('financeiro')
  getFinanceiro(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getFinanceiro(user.id)
  }
}
