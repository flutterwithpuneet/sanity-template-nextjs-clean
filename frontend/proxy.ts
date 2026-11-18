import { NextRequest, NextResponse } from 'next/server'
import { verifySession, signSession } from '@/lib/auth'

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
      
      const res = NextResponse.next()
      // Roll active session if older than 5 minutes
      if (user.lastActivity && Date.now() - user.lastActivity > 5 * 60 * 1000) {
        const refreshedToken = signSession(user, user.sessionToken)
        res.cookies.set('examforge_session', refreshedToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 7 * 24 * 60 * 60,
        })
      }
      return res
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

    const res = NextResponse.next()
    // Roll active session if older than 5 minutes
    if (user.lastActivity && Date.now() - user.lastActivity > 5 * 60 * 1000) {
      const refreshedToken = signSession(user, user.sessionToken)
      res.cookies.set('examforge_session', refreshedToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      })
    }
    return res
  }

  return NextResponse.next()
}

export const middleware = proxy

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
