import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { IngressosController } from './ingressos.controller'
import { IngressosService } from './ingressos.service'

@Module({
  imports: [AuthModule],
  controllers: [IngressosController],
  providers: [IngressosService],
  exports: [IngressosService],
})
export class IngressosModule {}
