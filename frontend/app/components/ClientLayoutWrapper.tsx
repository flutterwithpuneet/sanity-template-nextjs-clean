'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ExamStoreProvider } from '@/lib/store'

interface ClientLayoutWrapperProps {
  header: React.ReactNode
  footer: React.ReactNode
  children: React.ReactNode
  initialSession: any | null
}

const INACTIVITY_LIMIT_MS = 20 * 60 * 1000 // 20 minutes of continuous inactivity
const REFRESH_INTERVAL_MS = 60 * 1000 // Ping server at most once per minute during active use

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

  const lastActivityRef = useRef<number>(Date.now())
  const lastRefreshRef = useRef<number>(Date.now())
  const isLoggingOutRef = useRef<boolean>(false)

  const isAuthPage = pathname === '/login'
  const isAdminOrPractice = pathname.startsWith('/admin') || pathname.startsWith('/practice')

  const handleInactivityLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setSession(null)
    router.replace('/login?reason=inactivity')
  }, [router])

  // Inactivity and activity refresh tracker
  useEffect(() => {
    if (isAuthPage || !session) return

    // Reset activity timestamps on mount / route change
    lastActivityRef.current = Date.now()
    lastRefreshRef.current = Date.now()

    // Activity listener to detect mouse movement, keystrokes, clicks, scrolls
    const onUserActivity = () => {
      lastActivityRef.current = Date.now()

      // Refresh session token on server at most once every minute while user is active
      const now = Date.now()
      if (now - lastRefreshRef.current >= REFRESH_INTERVAL_MS) {
        lastRefreshRef.current = now
        fetch('/api/auth/refresh', { method: 'POST' })
          .then((res) => res.json())
          .then((data) => {
            if (data && data.expired) {
              handleInactivityLogout()
            }
          })
          .catch(() => {
            // ignore network glitch
          })
      }
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    activityEvents.forEach((ev) => window.addEventListener(ev, onUserActivity, { passive: true }))

    // Background interval checking idle time every 5 seconds
    const intervalId = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current
      if (idleTime >= INACTIVITY_LIMIT_MS) {
        handleInactivityLogout()
      }
    }, 5000)

    // Handle tab visibility change (e.g. user returns after being away)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const idleTime = Date.now() - lastActivityRef.current
        if (idleTime >= INACTIVITY_LIMIT_MS) {
          handleInactivityLogout()
        } else {
          onUserActivity()
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, onUserActivity))
      document.removeEventListener('visibilitychange', onVisibilityChange)
      clearInterval(intervalId)
    }
  }, [session, isAuthPage, handleInactivityLogout])

  // Initial authentication check
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession)
      setChecking(false)
      if (isAuthPage) {
        router.replace('/')
      }
      return
    }

    if (isAuthPage) {
      setChecking(false)
      return
    }

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

  // If not authenticated, block access completely with black shield
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
