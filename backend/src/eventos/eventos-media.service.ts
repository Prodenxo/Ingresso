import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common'
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import {
  createReadStream,
  createWriteStream,
  existsSync,
  mkdirSync,
  unlinkSync,
} from 'fs'
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
const UPLOAD_OBJECT_PREFIX = 'eventos/'

@Injectable()
export class EventosMediaService implements OnModuleInit {
  private s3Client: S3Client | null = null

  onModuleInit(): void {
    this.ensureUploadsDir()
    this.s3Client = this.createS3Client()
  }

  private createS3Client(): S3Client | null {
    const bucket = process.env.STORAGE_S3_BUCKET?.trim()
    if (!bucket) {
      return null
    }

    const region = process.env.STORAGE_S3_REGION?.trim() || 'auto'
    const endpoint = process.env.STORAGE_S3_ENDPOINT?.trim()
    const accessKeyId = process.env.STORAGE_S3_ACCESS_KEY_ID?.trim()
    const secretAccessKey = process.env.STORAGE_S3_SECRET_ACCESS_KEY?.trim()

    if (!accessKeyId || !secretAccessKey) {
      console.warn(
        '[EventosMedia] STORAGE_S3_BUCKET definido, mas credenciais S3 ausentes — usando disco local.',
      )
      return null
    }

    return new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: Boolean(endpoint),
    })
  }

  private usesObjectStorage(): boolean {
    return Boolean(this.s3Client && process.env.STORAGE_S3_BUCKET?.trim())
  }

  ensureUploadsDir(): void {
    if (!existsSync(UPLOADS_DIR)) {
      mkdirSync(UPLOADS_DIR, { recursive: true })
    }
  }

  normalizeUploadPath(publicUrl: string): string | null {
    const trimmed = publicUrl.trim()
    if (!trimmed) {
      return null
    }

    const apiMatch = trimmed.match(/\/api\/uploads\/eventos\/[^/?#]+/i)
    if (apiMatch) {
      return apiMatch[0]
    }

    const legacyMatch = trimmed.match(/\/uploads\/eventos\/[^/?#]+/i)
    if (legacyMatch) {
      return `/api${legacyMatch[0]}`
    }

    const objectMatch = trimmed.match(/(?:^|\/)eventos\/[^/?#]+/i)
    if (objectMatch && this.usesObjectStorage()) {
      return objectMatch[0].replace(/^\//, '')
    }

    return null
  }

  buildPublicUrl(filename: string): string {
    if (this.usesObjectStorage()) {
      const publicBase = process.env.STORAGE_S3_PUBLIC_BASE_URL?.trim().replace(/\/$/, '')
      const objectKey = `${UPLOAD_OBJECT_PREFIX}${filename}`

      if (publicBase) {
        return `${publicBase}/${objectKey}`
      }

      return objectKey
    }

    const path = `/api/uploads/eventos/${filename}`
    return this.withBackendPublicOrigin(path)
  }

  withBackendPublicOrigin(path: string): string {
    const publicBase = process.env.BACKEND_PUBLIC_URL?.trim().replace(/\/$/, '')

    if (!publicBase || path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    return `${publicBase}${path.startsWith('/') ? path : `/${path}`}`
  }

  resolvePublicUrl(publicUrl: string | null | undefined): string | null {
    if (!publicUrl?.trim()) {
      return null
    }

    const trimmed = publicUrl.trim()

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed
    }

    const normalized = this.normalizeUploadPath(trimmed)
    if (!normalized) {
      return null
    }

    if (normalized.startsWith('/api/uploads/')) {
      return this.withBackendPublicOrigin(normalized)
    }

    const publicBase = process.env.STORAGE_S3_PUBLIC_BASE_URL?.trim().replace(/\/$/, '')
    if (publicBase) {
      return `${publicBase}/${normalized}`
    }

    return normalized
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

    const buffer = await this.readFileBuffer(file)
    const extension = extname(file.originalname).toLowerCase() || '.jpg'
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(
      extension,
    )
      ? extension
      : '.jpg'
    const filename = `${randomUUID()}${safeExt}`

    let publicUrl: string

    if (this.usesObjectStorage()) {
      publicUrl = await this.uploadToObjectStorage(
        buffer,
        filename,
        file.mimetype,
      )
    } else {
      this.ensureUploadsDir()
      const destination = join(UPLOADS_DIR, filename)
      await pipeline(Readable.from(buffer), createWriteStream(destination))

      if (!existsSync(destination)) {
        throw new BadRequestException(
          'Não foi possível salvar a imagem no servidor. Verifique o volume de uploads.',
        )
      }

      publicUrl = this.buildPublicUrl(filename)
    }

    if (file.path) {
      try {
        unlinkSync(file.path)
      } catch {
        // arquivo temporário já removido
      }
    }

    if (previousUrl) {
      this.removeByPublicUrl(previousUrl)
    }

    return publicUrl
  }

  private async readFileBuffer(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer?.length) {
      return file.buffer
    }

    if (file.path) {
      const { readFile } = await import('fs/promises')
      return readFile(file.path)
    }

    throw new BadRequestException('Arquivo de imagem inválido')
  }

  private async uploadToObjectStorage(
    buffer: Buffer,
    filename: string,
    contentType: string,
  ): Promise<string> {
    const bucket = process.env.STORAGE_S3_BUCKET?.trim()
    const client = this.s3Client

    if (!bucket || !client) {
      throw new BadRequestException('Armazenamento em nuvem não configurado')
    }

    const objectKey = `${UPLOAD_OBJECT_PREFIX}${filename}`

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: objectKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    )

    return this.buildPublicUrl(filename)
  }

  removeByPublicUrl(publicUrl: string | null | undefined): void {
    if (!publicUrl?.trim()) {
      return
    }

    if (this.usesObjectStorage()) {
      void this.removeFromObjectStorage(publicUrl)
      return
    }

    const normalized = this.normalizeUploadPath(publicUrl)
    if (!normalized?.startsWith('/api/uploads/eventos/')) {
      return
    }

    const filename = normalized.split('/').pop()
    if (!filename) {
      return
    }

    const filePath = join(UPLOADS_DIR, filename)
    if (existsSync(filePath)) {
      unlinkSync(filePath)
    }
  }

  private async removeFromObjectStorage(publicUrl: string): Promise<void> {
    const bucket = process.env.STORAGE_S3_BUCKET?.trim()
    const client = this.s3Client

    if (!bucket || !client) {
      return
    }

    const normalized = this.normalizeUploadPath(publicUrl)
    if (!normalized) {
      return
    }

    const objectKey = normalized.startsWith('/api/uploads/')
      ? `${UPLOAD_OBJECT_PREFIX}${normalized.split('/').pop() ?? ''}`
      : normalized

    if (!objectKey || objectKey === UPLOAD_OBJECT_PREFIX) {
      return
    }

    try {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
      )
    } catch {
      // remoção best-effort
    }
  }
}
