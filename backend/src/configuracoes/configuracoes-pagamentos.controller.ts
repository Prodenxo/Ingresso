import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { AuthenticatedUser } from '../auth/types/jwt-payload.type'
import { ConfiguracoesPagamentosService } from './configuracoes-pagamentos.service'
import { SalvarGatewayPagamentoDto } from './dto/salvar-gateway-pagamento.dto'

@Controller('configuracoes/pagamentos')
@UseGuards(JwtAuthGuard)
export class ConfiguracoesPagamentosController {
  constructor(
    private readonly pagamentosService: ConfiguracoesPagamentosService,
  ) {}

  @Get()
  obter(@CurrentUser() user: AuthenticatedUser) {
    return this.pagamentosService.obterResumo(user.id)
  }

  @Put()
  salvar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SalvarGatewayPagamentoDto,
  ) {
    return this.pagamentosService.salvar(user.id, dto)
  }

  @Post('testar')
  testar(@CurrentUser() user: AuthenticatedUser) {
    return this.pagamentosService.testarConexao(user.id)
  }

  @Delete()
  remover(@CurrentUser() user: AuthenticatedUser) {
    return this.pagamentosService.remover(user.id)
  }
}
