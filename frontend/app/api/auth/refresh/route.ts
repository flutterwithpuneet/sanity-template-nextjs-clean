import { NextRequest, NextResponse } from 'next/server'
import { validateSessionWithDatabase, signSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('examforge_session')?.value
    const user = await validateSessionWithDatabase(token)

    if (!user) {
      const response = NextResponse.json(
        { success: false, expired: true, error: 'Session expired or invalidated' },
        { status: 401 }
      )
      response.cookies.delete('examforge_session')
      return response
    }

    // Generate refreshed token with new lastActivity timestamp
    const newToken = signSession(user, user.sessionToken)

    const response = NextResponse.json({
      success: true,
      refreshed: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    })

    response.cookies.set('examforge_session', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Refresh failed' },
      { status: 500 }
    )
  }
}
