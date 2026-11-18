import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Check admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const token = req.cookies.get('examforge_session')?.value
    const user = verifySession(token)

    // For API routes
    if (pathname.startsWith('/api/admin')) {
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Authentication required', code: 'UNAUTHENTICATED' },
          { status: 401 }
        )
      }
      if (user.role !== 'admin') {
        return NextResponse.json(
          { success: false, error: 'Forbidden: Admin access required', code: 'FORBIDDEN' },
          { status: 403 }
        )
      }
      return NextResponse.next()
    }

    // For Page routes (/admin/*)
    if (!user) {
      const loginUrl = new URL('/login', req.nextUrl)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (user.role !== 'admin') {
      const unauthorizedUrl = new URL('/practice', req.nextUrl)
      unauthorizedUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(unauthorizedUrl)
    }
  }

  return NextResponse.next()
}

export const middleware = proxy

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
