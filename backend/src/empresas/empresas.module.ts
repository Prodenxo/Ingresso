import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { SuperAdminGuard } from '../auth/guards/superadmin.guard'
import { PrismaModule } from '../prisma/prisma.module'
import { EmpresasController } from './empresas.controller'
import { EmpresasService } from './empresas.service'

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [EmpresasController],
  providers: [EmpresasService, SuperAdminGuard],
  exports: [EmpresasService],
})
export class EmpresasModule {}
