import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { CheckInModule } from './check-in/check-in.module'
import { ConfiguracoesModule } from './configuracoes/configuracoes.module'
import { EmpresaContextMiddleware } from './common/middleware/empresa-context.middleware'
import { DashboardModule } from './dashboard/dashboard.module'
import { EmpresasModule } from './empresas/empresas.module'
import { EventosModule } from './eventos/eventos.module'
import { HealthModule } from './health/health.module'
import { IngressosModule } from './ingressos/ingressos.module'
import { CursosModule } from './cursos/cursos.module'
import { LinksIndicacaoModule } from './links-indicacao/links-indicacao.module'
import { MembrosModule } from './membros/membros.module'
import { PedidosModule } from './pedidos/pedidos.module'
import { PrismaModule } from './prisma/prisma.module'
import { WebhooksModule } from './webhooks/webhooks.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    AuthModule,
    DashboardModule,
    ConfiguracoesModule,
    CheckInModule,
    EmpresasModule,
    EventosModule,
    IngressosModule,
    PedidosModule,
    MembrosModule,
    LinksIndicacaoModule,
    CursosModule,
    WebhooksModule,
  ],
  providers: [EmpresaContextMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(EmpresaContextMiddleware).forRoutes('*')
  }
}
