import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      console.warn('[Prisma] DATABASE_URL não configurada — configure o MySQL do EasyPanel no .env')
      return
    }

    try {
      await this.$connect()
    } catch {
      console.warn('[Prisma] Não foi possível conectar ao banco. Verifique a URL do MySQL no EasyPanel.')
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
