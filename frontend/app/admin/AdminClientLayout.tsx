'use client'

import React, { useState } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import type { SessionUser } from '@/lib/auth'

export default function AdminClientLayout({
  children,
  user,
}: {
  children: React.ReactNode
  user?: SessionUser
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#090909] text-[#FAFAFA] font-sans selection:bg-[#252525] selection:text-[#FAFAFA]">
      <AdminSidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <AdminHeader onToggleMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-7xl w-full mx-auto pb-16">
          {children}
        </main>
      </div>
    </div>
  )
}
