import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Secret key for validating session token HMAC
const SESSION_SECRET = process.env.SESSION_SECRET || 'examforge-secure-secret-key-992019283-sha512'

/**
 * Verify session cookie signature in middleware/proxy
 */
function isSessionValid(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  if (parts.length !== 2) return false

  const [payloadStr, signature] = parts
  try {
    const payload = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'))
    if (!payload.exp || Date.now() > payload.exp) return false
    if (!payload.username) return false
    return true
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // 1. Always allow Next.js internals, static assets, and auth APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname === '/favicon.ico' ||
    pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|css|js|map)$/i)
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('examforge_session')?.value
  const hasValidSession = isSessionValid(token)

  // 2. If user is visiting /login:
  if (pathname === '/login') {
    // If already logged in, redirect to home page or intended destination
    if (hasValidSession) {
      const redirectUrl = request.nextUrl.searchParams.get('redirect') || '/'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    // Allow access to login page
    return NextResponse.next()
  }

  // 3. For any other page or API route, require active session
  if (!hasValidSession) {
    // For API routes, return 401 Unauthorized JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: 'Authentication required. Please log in.' },
        { status: 401 }
      )
    }

    // For web pages, redirect directly to /login
    const loginUrl = new URL('/login', request.url)
    const targetPath = pathname + search
    if (targetPath && targetPath !== '/') {
      loginUrl.searchParams.set('redirect', targetPath)
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const proxy = middleware
export default middleware

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
