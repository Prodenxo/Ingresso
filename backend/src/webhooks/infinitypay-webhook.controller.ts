import { Body, Controller, Param, Post } from '@nestjs/common'
import { PedidosService } from '../pedidos/pedidos.service'

@Controller('webhooks/infinitypay')
export class InfinityPayWebhookController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post(':empresaId')
  receber(
    @Param('empresaId') empresaId: string,
    @Body() payload: unknown,
  ) {
    return this.pedidosService.processarWebhookInfinityPay(empresaId, payload)
  }
}
