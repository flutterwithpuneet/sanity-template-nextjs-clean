'use client'

import React, { useEffect } from 'react'
import { Icons } from './Icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-3xl',
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div
          className={`relative w-full ${maxWidthClasses} bg-[#111111] rounded-2xl shadow-2xl border border-[#262626] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F1F1F] bg-[#151515]">
            <div>
              <h3 className="text-sm font-bold text-[#FAFAFA] tracking-tight">{title}</h3>
              {subtitle && <p className="text-xs text-[#71717A] mt-0.5">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors"
            >
              <Icons.Close size={17} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 text-[#FAFAFA]">{children}</div>
        </div>
      </div>
    </div>
  )
}
