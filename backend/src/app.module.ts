import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { ConfiguracoesModule } from './configuracoes/configuracoes.module'
import { DashboardModule } from './dashboard/dashboard.module'
import { EmpresasModule } from './empresas/empresas.module'
import { EventosModule } from './eventos/eventos.module'
import { HealthModule } from './health/health.module'
import { IngressosModule } from './ingressos/ingressos.module'
import { PedidosModule } from './pedidos/pedidos.module'
import { PrismaModule } from './prisma/prisma.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    DashboardModule,
    ConfiguracoesModule,
    EmpresasModule,
    EventosModule,
    IngressosModule,
    PedidosModule,
  ],
})
export class AppModule {}
