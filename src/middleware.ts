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

  // Note: /admin is guarded by route-level checks in src/app/admin/page.tsx
  // returning 404 notFound() to prevent revealing that /admin exists.


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
