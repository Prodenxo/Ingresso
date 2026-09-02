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

  const normalizeOrigin = (origin: string): string =>
    origin.trim().replace(/\/$/, '')

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://127.0.0.1:3000')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)

  const frontendUrl = process.env.FRONTEND_URL
    ? normalizeOrigin(process.env.FRONTEND_URL)
    : undefined

  if (frontendUrl && !corsOrigins.includes(frontendUrl)) {
    corsOrigins.push(frontendUrl)
  }

  const allowVercelOrigins = process.env.CORS_ALLOW_VERCEL !== 'false'

  const isOriginAllowed = (origin?: string): boolean => {
    if (!origin) return true

    const normalized = normalizeOrigin(origin)
    if (corsOrigins.includes(normalized)) return true

    if (allowVercelOrigins) {
      try {
        const { hostname } = new URL(normalized)
        if (hostname.endsWith('.vercel.app')) return true
      } catch {
        return false
      }
    }

    return false
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true)
        return
      }

      callback(new Error(`Origem bloqueada pelo CORS: ${origin ?? 'desconhecida'}`))
    },
    credentials: true,
  })

  console.log(
    `CORS habilitado para: ${corsOrigins.join(', ')}${
      allowVercelOrigins ? ' + *.vercel.app' : ''
    }`,
  )

  const port = Number(process.env.PORT ?? 3001)
  console.log(`Uploads em: ${uploadsRoot}`)
  await app.listen(port, '0.0.0.0')
}

bootstrap()
