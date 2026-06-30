import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common'
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import { getFlyerMaxBytes, getFlyerMaxMbLabel } from './eventos-media.config'

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export const UPLOADS_DIR = join(process.cwd(), 'uploads', 'eventos')

@Injectable()
export class EventosMediaService implements OnModuleInit {
  onModuleInit(): void {
    this.ensureUploadsDir()
  }
  ensureUploadsDir(): void {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true })
    }
  }

  buildPublicUrl(filename: string): string {
    return `/api/uploads/eventos/${filename}`
  }

  async saveFlyer(
    file: Express.Multer.File,
    previousUrl?: string | null,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Arquivo de imagem é obrigatório')
    }

    if (!ALLOWED_MIMES.has(file.mimetype)) {
      throw new BadRequestException(
        'Formato inválido. Use JPG, PNG, WebP ou GIF',
      )
    }

    if (file.size > getFlyerMaxBytes()) {
      throw new BadRequestException(
        `Imagem deve ter no máximo ${getFlyerMaxMbLabel()}`,
      )
    }

    this.ensureUploadsDir()

    const extension = extname(file.originalname).toLowerCase() || '.jpg'
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(
      extension,
    )
      ? extension
      : '.jpg'
    const filename = `${randomUUID()}${safeExt}`
    const destination = join(UPLOADS_DIR, filename)

    await pipeline(Readable.from(file.buffer), createWriteStream(destination))

    if (previousUrl) {
      this.removeByPublicUrl(previousUrl)
    }

    return this.buildPublicUrl(filename)
  }

  removeByPublicUrl(publicUrl: string | null | undefined): void {
    if (!publicUrl?.startsWith('/api/uploads/eventos/')) {
      return
    }

    const filename = publicUrl.split('/').pop()

    if (!filename) {
      return
    }

    const filePath = join(UPLOADS_DIR, filename)

    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }
}
