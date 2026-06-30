import { Controller, Get } from '@nestjs/common'
import { EventosService } from './eventos.service'

@Controller('eventos')
export class EventosController {
  constructor(private readonly eventosService: EventosService) {}

  @Get('disponiveis')
  findDisponiveis() {
    return this.eventosService.findDisponiveis()
  }
}
