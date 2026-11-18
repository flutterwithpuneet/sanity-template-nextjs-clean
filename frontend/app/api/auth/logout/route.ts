import { NextRequest, NextResponse } from 'next/server'
import { verifySession, revokeSessionByToken, logAudit } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('examforge_session')?.value
  const user = verifySession(token)

  if (user?.sessionToken) {
    await revokeSessionByToken(user.sessionToken)
    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: 'LOGOUT',
      targetId: user.id,
      targetType: user.role,
      ipAddress: req.headers.get('x-forwarded-for') || null,
      userAgent: req.headers.get('user-agent') || null,
    })
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  })

  response.cookies.delete('examforge_session')
  response.cookies.set('examforge_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('examforge_session')?.value
  const user = verifySession(token)

  if (user?.sessionToken) {
    await revokeSessionByToken(user.sessionToken)
  }

  const redirectUrl = new URL('/login', req.nextUrl)
  const response = NextResponse.redirect(redirectUrl)

  response.cookies.delete('examforge_session')
  response.cookies.set('examforge_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })

  return response
}
