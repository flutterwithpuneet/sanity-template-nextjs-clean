'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/admin/Icons'

interface AttemptItem {
  id: number
  student_id: number
  assessment_id: number
  status: string
  total_questions: number
  attempted_questions: number
  correct_answers: number
  incorrect_answers: number
  unanswered_questions: number
  obtained_marks: number
  total_marks: number
  percentage: number
  accuracy: number
  time_taken_seconds: number
  passed: number
  submission_time: string
  created_at: string
  student_name: string
  student_email: string
  assessment_title: string
  duration_minutes: number
}

interface StudentResultsModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: number
  studentName?: string
}

export default function StudentResultsModal({
  isOpen,
  onClose,
  studentId,
  studentName,
}: StudentResultsModalProps) {
  const [attempts, setAttempts] = useState<AttemptItem[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!isOpen || !studentId) return

    const fetchAttempts = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/student/attempts?student_id=${studentId}`)
        const data = await res.json()
        if (data.success) {
          setAttempts(data.attempts || [])
        } else {
          setError(data.error || 'Failed to load test history')
        }
      } catch (err: any) {
        setError(err.message || 'Error connecting to server')
      } finally {
        setLoading(false)
      }
    }

    fetchAttempts()
  }, [isOpen, studentId])

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0s'
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // Filtered attempts
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return attempts
    const q = searchQuery.toLowerCase().trim()
    return attempts.filter(
      (a) =>
        a.assessment_title?.toLowerCase().includes(q) ||
        `#${a.id}`.includes(q)
    )
  }, [attempts, searchQuery])

  // Aggregate stats
  const totalAttempts = attempts.length
  const avgPercentage =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, a) => sum + Number(a.percentage || 0), 0) / totalAttempts)
      : 0
  const passedCount = attempts.filter((a) => a.passed === 1).length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#0E0E0E] border border-[#262626] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#FAFAFA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between bg-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black">
              📊
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight flex items-center gap-2">
                <span>My Examination Results (मेरे परिणाम)</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1F1F1F] text-[#A1A1AA] border border-[#2C2C2C]">
                  {attempts.length} {attempts.length === 1 ? 'Submission' : 'Submissions'}
                </span>
              </h2>
              <p className="text-xs text-[#71717A]">
                Comprehensive performance history, marks, and detailed diagnostic reports for {studentName || 'Student'}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#181818] hover:bg-[#252525] border border-[#2B2B2B] text-[#A1A1AA] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Quick summary stats banner */}
        <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-[#111111] border-b border-[#202020] text-center text-xs">
          <div>
            <span className="text-[#71717A] text-[10px] uppercase font-mono block">Tests Completed</span>
            <strong className="text-white font-mono text-sm">{totalAttempts}</strong>
          </div>
          <div>
            <span className="text-[#71717A] text-[10px] uppercase font-mono block">Passed / Clearance</span>
            <strong className="text-emerald-400 font-mono text-sm">
              {passedCount} / {totalAttempts}
            </strong>
          </div>
          <div>
            <span className="text-[#71717A] text-[10px] uppercase font-mono block">Average Score</span>
            <strong className="text-white font-mono text-sm">{avgPercentage}%</strong>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-[#101010] border-b border-[#202020] flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Icons.Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
            />
            <input
              type="text"
              placeholder="Search by test title or attempt #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#262626] bg-[#161616] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>
          <span className="text-xs font-mono text-[#71717A] shrink-0">
            {filtered.length} of {attempts.length}
          </span>
        </div>

        {/* Attempt List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-16 text-center text-xs text-[#71717A] space-y-2">
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin mx-auto mb-2" />
              <span>Loading your examination results...</span>
            </div>
          ) : error ? (
            <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-800 text-rose-300 text-xs text-center">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#71717A] space-y-2">
              <div className="text-3xl">📝</div>
              <div className="text-sm font-semibold text-white">No Submitted Attempts Found</div>
              <p className="max-w-xs mx-auto text-[#71717A]">
                You haven&apos;t completed any tests matching your search yet. Complete a test in the Practice Portal to view your report here.
              </p>
            </div>
          ) : (
            filtered.map((att) => (
              <div
                key={att.id}
                className="p-4 rounded-2xl bg-[#141414] border border-[#262626] hover:border-[#383838] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
              >
                {/* Left: Test Details */}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-[#202020] font-mono font-bold text-[10px] text-white border border-[#303030]">
                      Attempt #{att.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] uppercase ${
                        att.passed === 1
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
                      }`}
                    >
                      {att.passed === 1 ? 'PASSED' : 'RETAKE'}
                    </span>
                    <span className="text-[10px] text-[#71717A] font-mono">
                      {formatDate(att.submission_time || att.created_at)}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white leading-snug">
                    {att.assessment_title}
                  </h3>

                  <div className="text-[11px] text-[#A1A1AA] flex items-center gap-3 font-mono pt-0.5">
                    <span>
                      Questions: <strong>{att.attempted_questions || (att.correct_answers + att.incorrect_answers)}</strong> / {att.total_questions}
                    </span>
                    <span>•</span>
                    <span className="text-emerald-400">
                      +{att.correct_answers} Correct
                    </span>
                    <span>•</span>
                    <span className="text-rose-400">
                      -{att.incorrect_answers} Wrong
                    </span>
                    <span>•</span>
                    <span>Time: {formatSeconds(att.time_taken_seconds)}</span>
                  </div>
                </div>

                {/* Right: Score Metric & Action Button */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#202020]">
                  <div className="text-right">
                    <div className="text-lg font-black font-mono text-white">
                      {Number(att.obtained_marks).toFixed(1)}{' '}
                      <span className="text-xs text-[#71717A] font-normal">
                        / {Number(att.total_marks).toFixed(0)}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono font-bold text-[#A1A1AA]">
                      {Number(att.percentage).toFixed(0)}% Score • {Number(att.accuracy || 0).toFixed(0)}% Acc
                    </div>
                  </div>

                  <Link
                    href={`/practice/result/${att.id}`}
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-white text-black hover:bg-[#E4E4E7] font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <span>Full Report</span>
                    <Icons.ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#111111] border-t border-[#202020] flex items-center justify-between text-xs text-[#71717A]">
          <span>Press ESC or click close to return to practice.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#2B2B2B] text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
