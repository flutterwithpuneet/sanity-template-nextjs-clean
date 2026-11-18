'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icons } from './Icons'
import { ExamForgeLogo } from '@/components/brand'

interface AdminSidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function AdminSidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: AdminSidebarProps) {
  const pathname = usePathname()

  const navModules = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: Icons.Dashboard,
      exact: true,
    },
    {
      label: 'Exam Management',
      href: '/admin/exams',
      icon: Icons.Exams,
    },
    {
      label: 'Subjects',
      href: '/admin/subjects',
      icon: Icons.Subjects,
    },
    {
      label: 'Topic Hierarchy',
      href: '/admin/topics',
      icon: Icons.Topics,
    },
    {
      label: 'Question Bank',
      href: '/admin/questions',
      icon: Icons.Questions,
    },
    {
      label: 'Mock Tests',
      href: '/admin/practice-tests',
      icon: Icons.PracticeTests,
    },
    {
      label: 'Student Management',
      href: '/admin/students',
      icon: Icons.Students,
    },
    {
      label: 'Results & Analytics',
      href: '/admin/results',
      icon: Icons.Results,
    },
    {
      label: 'Question Reports',
      href: '/admin/reports',
      icon: Icons.Reports,
    },
    {
      label: 'Admin & Roles',
      href: '/admin/admins',
      icon: Icons.Admins,
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: Icons.Settings,
    },
  ]

  const isActive = (itemHref: string, exact?: boolean) => {
    if (exact) {
      return pathname === itemHref
    }
    return pathname.startsWith(itemHref)
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0C0C0C] border-r border-[#262626] transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo / Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#262626] bg-[#0C0C0C]">
          <Link
            href="/admin"
            className="flex items-center gap-3 overflow-hidden focus:outline-none group"
          >
            <ExamForgeLogo variant="badge" size={20} className="w-9 h-9 rounded-xl shrink-0 group-hover:border-[#3F3F46] transition-colors" />
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[#FAFAFA] text-sm leading-tight tracking-tight">
                  ExamForge
                </span>
                <span className="text-[10px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
                  Admin Platform
                </span>
              </div>
            )}
          </Link>

          {/* Toggle button on desktop */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <Icons.ChevronRight
              size={16}
              className={`transform transition-transform duration-200 ${
                collapsed ? '' : 'rotate-180'
              }`}
            />
          </button>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020]"
          >
            <Icons.Close size={18} />
          </button>
        </div>

        {/* Candidate Portal Quick Switch Banner */}
        <div className="px-3 pt-3">
          <Link
            href="/practice"
            target="_blank"
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[#171717] text-[#A1A1AA] border border-[#262626] hover:bg-[#202020] hover:text-[#FAFAFA] hover:border-[#3F3F46] transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
            title="Open Student MCQ Practice Portal"
          >
            <Icons.CandidatePortal size={15} className="shrink-0 text-[#FAFAFA]" />
            {!collapsed && (
              <span className="truncate flex-1 font-sans">Student Portal ↗</span>
            )}
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          <div className="px-3 pb-1 text-[10px] font-mono font-semibold text-[#52525B] uppercase tracking-wider">
            {!collapsed ? 'Modules' : '•'}
          </div>

          {navModules.map((item) => {
            const active = isActive(item.href, item.exact)
            const IconComponent = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                  active
                    ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46] shadow-2xs font-semibold'
                    : 'text-[#71717A] hover:bg-[#202020] hover:text-[#FAFAFA] border border-transparent'
                }`}
              >
                <div
                  className={`shrink-0 transition-colors ${
                    active ? 'text-[#FAFAFA]' : 'text-[#71717A] group-hover:text-[#FAFAFA]'
                  }`}
                >
                  <IconComponent size={17} />
                </div>

                {!collapsed && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3 border-t border-[#262626] bg-[#0C0C0C]">
          <div
            className={`flex items-center gap-3 p-2 rounded-xl bg-[#111111] border border-[#262626] ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-[#191919] border border-[#3F3F46] text-[#FAFAFA] flex items-center justify-center font-bold text-xs shrink-0">
              A
            </div>
            {!collapsed && (
              <div className="overflow-hidden flex-1">
                <div className="text-xs font-bold text-[#FAFAFA] truncate">
                  Super Admin
                </div>
                <div className="text-[10px] font-mono text-[#71717A] truncate">
                  puneet_a1 • IA Console
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
