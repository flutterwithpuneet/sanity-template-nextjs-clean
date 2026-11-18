import React from 'react'

interface IALogoProps {
  size?: number
  className?: string
  variant?: 'icon' | 'badge' | 'full'
  subtitle?: string
}

export function IAMark({
  size = 20,
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
      aria-label="Rajasthan Informatics Assistant Brand Mark"
    >
      {/* Outer Chamfered Silicon Matrix Frame */}
      <path
        d="M10 3H22L29 10V22L22 29H10L3 22V10L10 3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Inner Data Processor Core */}
      <rect
        x="11"
        y="11"
        width="10"
        height="10"
        rx="2"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      {/* Central Vertex Core */}
      <circle cx="16" cy="16" r="2" fill="currentColor" />
      {/* 4 Orthogonal Data Conduits */}
      <line
        x1="16"
        y1="3"
        x2="16"
        y2="11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="16"
        y1="21"
        x2="16"
        y2="29"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="3"
        y1="16"
        x2="11"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="21"
        y1="16"
        x2="29"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function IALogo({
  size = 18,
  className = '',
  variant = 'icon',
  subtitle,
}: IALogoProps) {
  if (variant === 'badge') {
    return (
      <div
        className={`w-7 h-7 rounded-lg bg-[#191919] border border-[#3F3F46] text-[#FAFAFA] flex items-center justify-center shrink-0 shadow-2xs hover:border-[#52525B] transition-colors ${className}`}
      >
        <IAMark size={size} />
      </div>
    )
  }

  if (variant === 'full') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <div className="w-7 h-7 rounded-lg bg-[#191919] border border-[#3F3F46] text-[#FAFAFA] flex items-center justify-center shrink-0 shadow-2xs">
          <IAMark size={size} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-[#FAFAFA] leading-tight tracking-tight">
            Rajasthan Informatics Assistant
          </span>
          <span className="text-[10px] font-mono text-[#71717A]">
            {subtitle || 'Administrative Control Console'}
          </span>
        </div>
      </div>
    )
  }

  return <IAMark size={size} className={className} />
}
