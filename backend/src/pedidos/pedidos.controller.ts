import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common'
import type { Response } from 'express'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import { CheckoutDto } from './dto/checkout.dto'
import { PedidosService } from './pedidos.service'

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @UseGuards(JwtAuthGuard)
  @Post('lotes/:loteId/checkout')
  checkout(
    @Param('loteId') loteId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutDto,
  ) {
    return this.pedidosService.checkoutLote(loteId, user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/boleto/pdf')
  async obterPdfBoleto(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    const pdf = await this.pedidosService.obterPdfBoleto(id, user.id)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `inline; filename="boleto-${id}.pdf"`,
    )
    res.send(pdf)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/status')
  obterStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pedidosService.obterStatusPedido(id, user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/confirmar-pix')
  confirmarPix(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.pedidosService.confirmarPix(id, user.id)
  }
}
