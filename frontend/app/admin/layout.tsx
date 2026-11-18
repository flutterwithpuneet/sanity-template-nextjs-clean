import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { validateSessionWithDatabase } from '@/lib/auth'
import AdminClientLayout from './AdminClientLayout'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('examforge_session')?.value
  const user = await validateSessionWithDatabase(token)

  if (!user) {
    redirect('/login?redirect=/admin')
  }

  if (user.role !== 'admin') {
    redirect('/practice?error=unauthorized')
  }

  return <AdminClientLayout user={user}>{children}</AdminClientLayout>
}
