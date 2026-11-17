'use client'

import React, { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ExamStoreProvider } from '@/lib/store'

interface ClientLayoutWrapperProps {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
  initialSession: any | null
}

export default function ClientLayoutWrapper({
  header,
  footer,
  children,
  initialSession,
}: ClientLayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [session, setSession] = useState<any | null>(initialSession)
  const [checking, setChecking] = useState<boolean>(!initialSession && pathname !== '/login')

  const isAuthPage = pathname === '/login'
  const isAdminOrPractice = pathname.startsWith('/admin') || pathname.startsWith('/practice')

  useEffect(() => {
    // If we already have initialSession from Server Component
    if (initialSession) {
      setSession(initialSession)
      setChecking(false)
      if (isAuthPage) {
        router.replace('/')
      }
      return
    }

    // If on /login page and not authenticated, no need to check or redirect
    if (isAuthPage) {
      setChecking(false)
      return
    }

    // Verify session client-side if initialSession was null
    let isMounted = true
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!isMounted) return

        if (data && data.authenticated && data.user) {
          setSession(data.user)
          setChecking(false)
        } else {
          // Not authenticated: redirect immediately to /login
          const currentPath = window.location.pathname + window.location.search
          router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
        }
      } catch {
        if (!isMounted) return
        const currentPath = window.location.pathname + window.location.search
        router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`)
      }
    }

    checkAuth()

    return () => {
      isMounted = false
    }
  }, [pathname, initialSession, isAuthPage, router])

  // If on login page, render cleanly without header/footer
  if (isAuthPage) {
    return (
      <ExamStoreProvider>
        <div className="min-h-screen bg-black text-white">{children}</div>
      </ExamStoreProvider>
    )
  }

  // If not authenticated and checking/redirecting, block access completely with black shield
  if (!session || checking) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-white font-black text-xl flex items-center justify-center mb-4 shadow-xl animate-pulse">
          EF
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">ExamForge Security</h2>
        <p className="text-xs text-neutral-400 mt-1 max-w-sm">
          Authentication required. Redirecting to login portal...
        </p>
      </div>
    )
  }

  // Authenticated candidate view
  return (
    <ExamStoreProvider>
      {isAdminOrPractice ? (
        <div className="min-h-screen bg-black text-white">{children}</div>
      ) : (
        <section className="min-h-screen pt-20 bg-black text-white flex flex-col justify-between">
          {header}
          <main className="bg-black text-white flex-1">{children}</main>
          {footer}
        </section>
      )}
    </ExamStoreProvider>
  )
}
