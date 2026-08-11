import { NextResponse, type NextRequest } from 'next/server'
import { isAppwriteConfigured, APPWRITE_CONFIG } from '@/lib/appwrite/config'

export async function middleware(request: NextRequest) {
  if (!isAppwriteConfigured()) {
    return NextResponse.next({ request })
  }

  const pathname = request.nextUrl.pathname
  const allCookies = request.cookies.getAll()
  const sessionCookie =
    allCookies.find((c) => c.name.startsWith('a_session') || c.name.includes('session'))?.value ||
    request.cookies.get('a_session')?.value

  // Gate /admin
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }

    try {
      const res = await fetch(`${APPWRITE_CONFIG.endpoint}/account`, {
        headers: {
          'x-appwrite-project': APPWRITE_CONFIG.projectId,
          'x-appwrite-session': sessionCookie,
        },
      })

      if (!res.ok) {
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Gate /settings/*
  if (pathname.startsWith('/settings')) {
    if (!sessionCookie) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
