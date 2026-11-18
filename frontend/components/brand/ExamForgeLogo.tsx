import React from 'react'

interface ExamForgeLogoProps {
  size?: number
  className?: string
  variant?: 'icon' | 'badge' | 'full'
  subtitle?: string
}

export function ExamForgeMark({
  size = 24,
  className = '',
}: {
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="ExamForge Logo Mark"
    >
      {/* Top Crown Wedge — Intellectual Apex */}
      <path
        d="M16 2.5L27.5 9.2V13L16 6.8L4.5 13V9.2L16 2.5Z"
        fill="currentColor"
      />
      {/* Left Crucible Wing with precision angled negative facet */}
      <path
        d="M4 14.8L14.2 10.2L12.2 16L14.2 21.8L4 26.2V14.8Z"
        fill="currentColor"
        fillOpacity="0.9"
      />
      {/* Right Crucible Wing with precision angled negative facet */}
      <path
        d="M28 14.8L17.8 10.2L19.8 16L17.8 21.8L28 26.2V14.8Z"
        fill="currentColor"
      />
      {/* Bottom Hearth Anvil Foundation */}
      <path
        d="M16 23.5L22 19.8L25.5 21.8L16 29.5L6.5 21.8L10 19.8L16 23.5Z"
        fill="currentColor"
        fillOpacity="0.95"
      />
      {/* Central Milestone Diamond Core */}
      <path
        d="M16 12.5L18.5 16L16 19.5L13.5 16L16 12.5Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function ExamForgeLogo({
  size = 24,
  className = '',
  variant = 'icon',
  subtitle,
}: ExamForgeLogoProps) {
  if (variant === 'badge') {
    return (
      <div
        className={`w-9 h-9 rounded-xl bg-[#151515] border border-[#262626] text-[#FAFAFA] flex items-center justify-center shrink-0 shadow-2xs hover:border-[#3F3F46] hover:bg-[#1A1A1A] transition-all ${className}`}
      >
        <ExamForgeMark size={size} />
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-9 h-9 rounded-xl bg-[#151515] border border-[#262626] text-[#FAFAFA] flex items-center justify-center shrink-0 shadow-2xs">
          <ExamForgeMark size={size} />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-[#FAFAFA] text-sm tracking-tight leading-tight">
            ExamForge
          </span>
          <span className="text-[10px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
            {subtitle || 'Platform'}
          </span>
        </div>
      </div>
    )
  }

  return <ExamForgeMark size={size} className={className} />
}
