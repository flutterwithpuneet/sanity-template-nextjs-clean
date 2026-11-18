import { NextRequest, NextResponse } from 'next/server'
import { authenticateCredentials, signSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      )
    }

    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || undefined

    const { user, error, sessionToken } = await authenticateCredentials(
      username,
      password,
      ipAddress,
      userAgent
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: error || 'Invalid username or password' },
        { status: 401 }
      )
    }

    const token = signSession(user, sessionToken)

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      message: 'Logged in successfully',
    })

    // Set HTTP-only secure session cookie
    response.cookies.set('examforge_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    })

    return response
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Authentication error' },
      { status: 500 }
    )
  }
}
