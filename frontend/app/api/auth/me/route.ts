import { NextRequest, NextResponse } from 'next/server'
import { validateSessionWithDatabase } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('examforge_session')?.value
  const user = await validateSessionWithDatabase(token)

  if (!user) {
    const res = NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    // Invalidate stale cookie on client
    res.cookies.delete('examforge_session')
    return res
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  })
}
