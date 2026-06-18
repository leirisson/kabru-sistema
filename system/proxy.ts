import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'

const ROTAS_PUBLICAS = ['/login']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ehPublica = ROTAS_PUBLICAS.some((r) => pathname.startsWith(r))

  const token = request.cookies.get('kabru-session')?.value
  const session = token ? await decrypt(token) : null

  if (!session && !ehPublica) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (session && pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
