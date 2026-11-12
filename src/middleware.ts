import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { getAuthSecret } from '@/lib/auth-secret'

export async function middleware(req: NextRequest) {
  const secureCookie = req.nextUrl.protocol === 'https:'
  const token = await getToken({ req, secret: await getAuthSecret(), secureCookie })
  const { pathname } = req.nextUrl
  const estLogin = pathname.startsWith('/login')
  if (!token && !estLogin) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }
  if (token && estLogin) {
    const url = req.nextUrl.clone()
    url.pathname = '/accueil'
    url.search = ''
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|fonts|favicon.ico|icon.svg|ebgc-blanc.png|ebgc-couleur.png).*)'],
}
