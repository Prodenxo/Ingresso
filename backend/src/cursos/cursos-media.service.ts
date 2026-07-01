import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common'
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs'
import { extname, join } from 'path'
import { randomUUID } from 'crypto'
import { pipeline } from 'stream/promises'
import { Readable } from 'stream'
import {
  getCursoVideoMaxBytes,
  getCursoVideoMaxMbLabel,
} from './cursos-media.config'

const ALLOWED_VIDEO_MIMES = new Set([
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
])

export const CURSOS_UPLOADS_DIR = join(process.cwd(), 'uploads', 'cursos')

@Injectable()
export class CursosMediaService implements OnModuleInit {
  onModuleInit(): void {
    this.ensureUploadsDir()
  }

  ensureUploadsDir(): void {
    if (!existsSync(CURSOS_UPLOADS_DIR)) {
      mkdirSync(CURSOS_UPLOADS_DIR, { recursive: true })
    }
  }

  buildPublicUrl(filename: string): string {
    return `/api/uploads/cursos/${filename}`
  }

  async saveVideo(
    file: Express.Multer.File,
    previousUrl?: string | null,
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('Arquivo de vídeo é obrigatório')
    }

    if (!ALLOWED_VIDEO_MIMES.has(file.mimetype)) {
      throw new BadRequestException('Formato inválido. Use MP4, WebM ou OGG')
    }

    if (file.size > getCursoVideoMaxBytes()) {
      throw new BadRequestException(
        `Vídeo deve ter no máximo ${getCursoVideoMaxMbLabel()}`,
      )
    }

    this.ensureUploadsDir()

    const extension = extname(file.originalname).toLowerCase()
    const safeExt = ['.mp4', '.webm', '.ogg', '.mov'].includes(extension)
      ? extension === '.mov'
        ? '.mp4'
        : extension
      : '.mp4'
    const filename = `${randomUUID()}${safeExt}`
    const destination = join(CURSOS_UPLOADS_DIR, filename)

    await pipeline(Readable.from(file.buffer), createWriteStream(destination))

    if (previousUrl) {
      this.removeByPublicUrl(previousUrl)
    }

    return this.buildPublicUrl(filename)
  }

  removeByPublicUrl(publicUrl: string | null | undefined): void {
    if (!publicUrl?.startsWith('/api/uploads/cursos/')) {
      return
    }

    const filename = publicUrl.split('/').pop()

    if (!filename) {
      return
    }

    const filePath = join(CURSOS_UPLOADS_DIR, filename)

    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }
}
