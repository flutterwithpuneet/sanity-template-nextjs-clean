'use client'

import React from 'react'
import Link from 'next/link'
import { Icons } from './Icons'
import { IALogo } from '@/components/brand'

interface AdminHeaderProps {
  onToggleMobile: () => void
}

export default function AdminHeader({ onToggleMobile }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0C0C0C]/90 backdrop-blur-md border-b border-[#262626] px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      {/* Left section: mobile hamburger & breadcrumb badge */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors"
          aria-label="Open Navigation"
        >
          <Icons.Menu size={18} />
        </button>

        <div className="flex items-center gap-2.5">
          <IALogo variant="badge" size={15} className="w-6 h-6 rounded-md bg-[#191919] border-[#3F3F46]" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[#FAFAFA] leading-tight tracking-tight">
              Rajasthan Informatics Assistant
            </span>
            <span className="text-[10px] font-mono text-[#71717A]">
              Administrative Control Console
            </span>
          </div>
        </div>
      </div>

      {/* Right section: System state, quick buttons & candidate link */}
      <div className="flex items-center gap-3">
        {/* Status chip */}
        <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#151515] border border-[#262626] text-[#A1A1AA] text-[11px] font-mono font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FAFAFA] animate-pulse"></span>
          <span>Database Live</span>
        </div>

        {/* Candidate Portal Quick Link */}
        <Link
          href="/practice"
          target="_blank"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors shadow-2xs"
          title="Open Student MCQ Practice Portal"
        >
          <Icons.CandidatePortal size={14} />
          <span>Student Portal ↗</span>
        </Link>

        {/* Admin Profile Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-[#151515] border border-[#262626] text-xs">
          <div className="w-5 h-5 rounded-full bg-[#202020] border border-[#3F3F46] text-[#FAFAFA] font-bold flex items-center justify-center text-[10px]">
            P
          </div>
          <span className="font-semibold text-[#FAFAFA] text-[11px]">Puneet</span>
        </div>
      </div>
    </header>
  )
}
