import { NextRequest, NextResponse } from 'next/server'
import { verifySession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('examforge_session')?.value
  const user = verifySession(token)

  if (!user) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    user,
  })
}
