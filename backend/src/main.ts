import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { join } from 'path'
import { AppModule } from './app.module'
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const uploadsRoot = join(process.cwd(), 'uploads')

  app.useStaticAssets(uploadsRoot, {
    prefix: '/api/uploads/',
  })

  app.setGlobalPrefix('api')
  app.useGlobalFilters(new PrismaExceptionFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://127.0.0.1:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  const frontendUrl = process.env.FRONTEND_URL?.trim()

  if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
    corsOrigins.push(frontendUrl)
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  })

  console.log(`CORS habilitado para: ${corsOrigins.join(', ')}`)

  const port = Number(process.env.PORT ?? 3001)
  console.log(`Uploads em: ${uploadsRoot}`)
  await app.listen(port, '0.0.0.0')
}

bootstrap()
