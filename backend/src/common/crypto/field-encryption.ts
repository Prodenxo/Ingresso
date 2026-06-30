import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const KEY_SALT = 'eventhub-payments-v1'

function resolveEncryptionKey(): Buffer {
  const secret = process.env.PAYMENTS_ENCRYPTION_KEY?.trim()

  if (!secret || secret.length < 32) {
    throw new Error(
      'PAYMENTS_ENCRYPTION_KEY não configurada (mínimo 32 caracteres)',
    )
  }

  return scryptSync(secret, KEY_SALT, 32)
}

export function encryptField(value: string): string {
  const key = resolveEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString('base64')
}

export function decryptField(payload: string): string {
  const key = resolveEncryptionKey()
  const buffer = Buffer.from(payload, 'base64')
  const iv = buffer.subarray(0, IV_LENGTH)
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)

  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8')
}

export function maskSecret(value: string): string {
  if (value.length <= 8) {
    return '••••••••'
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}
