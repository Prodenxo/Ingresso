import { request as httpsRequest } from 'node:https'
import { URL } from 'node:url'

export interface InterMtlsRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  url: string
  certificadoPem: string
  chavePrivadaPem: string
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}

export interface InterHttpResponse<T = unknown> {
  statusCode: number
  data: T
  rawBody: string
}

export function interMtlsRequest<T = unknown>(
  options: InterMtlsRequestOptions,
): Promise<InterHttpResponse<T>> {
  return new Promise((resolve, reject) => {
    const url = new URL(options.url)
    const timeoutMs = options.timeoutMs ?? 30_000

    const req = httpsRequest(
      {
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: options.method,
        cert: options.certificadoPem,
        key: options.chavePrivadaPem,
        headers: options.headers,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = []

        res.on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })

        res.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf8')
          let data: T

          try {
            data = rawBody ? (JSON.parse(rawBody) as T) : ({} as T)
          } catch {
            data = rawBody as T
          }

          resolve({
            statusCode: res.statusCode ?? 500,
            data,
            rawBody,
          })
        })
      },
    )

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Tempo esgotado ao conectar com o Banco Inter'))
    })

    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}
