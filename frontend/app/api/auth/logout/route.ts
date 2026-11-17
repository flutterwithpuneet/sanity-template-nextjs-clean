import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
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
