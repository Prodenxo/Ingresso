import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { EmpresaAccessService } from '../common/services/empresa-access.service'
import { EventosController } from './eventos.controller'
import { EventosMediaService } from './eventos-media.service'
import { EventosService } from './eventos.service'

@Module({
  imports: [AuthModule],
  controllers: [EventosController],
  providers: [EventosService, EventosMediaService, EmpresaAccessService],
  exports: [EventosService],
})
export class EventosModule {}
