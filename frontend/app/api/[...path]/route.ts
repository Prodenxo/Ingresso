import { NextRequest, NextResponse } from 'next/server'
import { getApiProxyTarget } from '@/lib/api-proxy-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ path: string[] }>
}

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  const { path } = await context.params
  const targetBase = getApiProxyTarget()
  const pathname = path.join('/')
  const targetUrl = `${targetBase}/${pathname}${request.nextUrl.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')
  headers.delete('content-length')

  const hasBody = !['GET', 'HEAD'].includes(request.method)

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: hasBody ? request.body : undefined,
      duplex: hasBody ? 'half' : undefined,
    } as RequestInit)

    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete('transfer-encoding')

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    })
  } catch {
    return NextResponse.json(
      { message: 'Backend indisponível. Verifique API_PROXY_TARGET no servidor.' },
      { status: 502 },
    )
  }
}

export function GET(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function POST(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function PUT(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function PATCH(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function DELETE(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}

export function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxyRequest(request, context)
}
