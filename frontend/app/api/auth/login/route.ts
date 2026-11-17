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

    const user = await authenticateCredentials(username, password)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      )
    }

    const token = signSession(user)

    const response = NextResponse.json({
      success: true,
      user,
      message: 'Logged in successfully',
    })

    // Set HTTP-only session cookie
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
