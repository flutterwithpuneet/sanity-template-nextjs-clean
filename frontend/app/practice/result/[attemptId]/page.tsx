'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ResultPageSkeleton } from '@/app/components/Shimmer'
import { Icons } from '@/components/admin/Icons'
import { ExamForgeLogo } from '@/components/brand'
import BookmarkModal from '@/components/student/BookmarkModal'

export default function ExamResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Expandable question solutions
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({})

  // Question Bookmarks State
  const [bookmarkedQIds, setBookmarkedQIds] = useState<Set<number>>(new Set())
  const [showBookmarksModal, setShowBookmarksModal] = useState<boolean>(false)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/student/attempts/${attemptId}`)
        const json = await res.json()
        if (json.success) {
          setData(json)
          // Default all explanations to open
          const defaultOpen: Record<number, boolean> = {}
          json.answers?.forEach((a: any) => {
            defaultOpen[a.question_id] = true
          })
          setExpandedSolutions(defaultOpen)

          // Fetch student bookmarks if student_id exists
          if (json.attempt?.student_id) {
            fetch(`/api/student/bookmarks?student_id=${json.attempt.student_id}`)
              .then((r) => r.json())
              .then((bData) => {
                if (bData.success && bData.question_ids) {
                  setBookmarkedQIds(new Set(bData.question_ids))
                }
              })
              .catch(() => {})
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchResult()
  }, [attemptId])

  const toggleSolution = (qId: number) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }))
  }

  const handleToggleBookmark = async (qId: number) => {
    if (!data?.attempt?.student_id) return
    const wasBookmarked = bookmarkedQIds.has(qId)
    setBookmarkedQIds((prev) => {
      const next = new Set(prev)
      if (wasBookmarked) next.delete(qId)
      else next.add(qId)
      return next
    })

    try {
      await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data.attempt.student_id,
          question_id: qId,
          action: wasBookmarked ? 'remove' : 'add',
        }),
      })
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    }
  }

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0s'
    const m = Math.floor(sec / 60)
    const s = sec % 60
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  }

  if (loading || !data) {
    return <ResultPageSkeleton />
  }

  const { attempt, answers = [] } = data

  // Time Analysis metrics
  const timesArray = answers.map((a: any) => Number(a.time_spent_seconds || 0))
  const maxTime = Math.max(...timesArray, 1)
  const minTime = Math.min(...timesArray)
  const avgTime = timesArray.length > 0 ? Math.round(timesArray.reduce((a: number, b: number) => a + b, 0) / timesArray.length) : 0

  return (
    <div className="min-h-screen bg-[#090909] text-[#FAFAFA] font-sans pb-16 selection:bg-[#222222] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0C0C0C]/90 backdrop-blur-md text-[#FAFAFA] px-4 md:px-8 py-3.5 border-b border-[#262626] flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <ExamForgeLogo variant="badge" size={18} className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="font-extrabold text-sm md:text-base leading-tight text-white">
              Test Performance & Time Analysis
            </h1>
            <div className="text-[10px] text-[#71717A] font-mono">
              Attempt #{attempt.id} • Candidate: {attempt.student_name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowBookmarksModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.BookmarkFilled size={13} className={bookmarkedQIds.size > 0 ? 'text-amber-400' : 'text-[#71717A]'} />
            <span className="hidden sm:inline">Saved Bookmarks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#222222] text-white font-mono font-bold text-[10px]">
              {bookmarkedQIds.size}
            </span>
          </button>

          <Link
            href="/practice"
            className="px-3.5 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white font-semibold text-xs transition-colors"
          >
            Practice Portal
          </Link>
          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-xs transition-colors shadow-xs"
          >
            Admin Panel
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Top Scorecard Banner */}
        <div className="rounded-3xl bg-[#111111] border border-[#262626] p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                attempt.passed ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/80' : 'bg-amber-950/70 text-amber-400 border border-amber-800/80'
              }`}
            >
              {attempt.passed ? '✓ PASSED EXAMINATION' : '⚠ RETAKE RECOMMENDED'}
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {attempt.assessment_title}
            </h2>
            <p className="text-xs text-[#A1A1AA]">
              ExamForge Automated Server-Side Scoring & Question-Level Timing Breakdown.
            </p>
          </div>

          {/* Large Score Metric */}
          <div className="flex items-center gap-4 bg-[#161616] p-4 rounded-2xl border border-[#262626] shrink-0">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-mono text-white">
                {Number(attempt.obtained_marks).toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-[#71717A] uppercase mt-0.5">
                Marks out of {Number(attempt.total_marks).toFixed(0)}
              </div>
            </div>
            <div className="h-10 w-px bg-[#262626]"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-mono text-white">
                {Number(attempt.percentage).toFixed(0)}%
              </div>
              <div className="text-[10px] font-bold text-[#71717A] uppercase mt-0.5">
                Percentage
              </div>
            </div>
          </div>
        </div>

        {/* Detailed KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-xs font-bold text-[#71717A] uppercase">Correct Answers</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {attempt.correct_answers}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">+{attempt.correct_answers * 1.0} Marks</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-xs font-bold text-[#71717A] uppercase">Wrong Answers</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {attempt.incorrect_answers}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">
              -{Number(attempt.incorrect_answers * 0.25).toFixed(2)} Penalty
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-xs font-bold text-[#71717A] uppercase">Accuracy</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {Number(attempt.accuracy || 0).toFixed(0)}%
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">Correct / Attempted</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-xs font-bold text-[#71717A] uppercase">Total Test Time</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {formatSeconds(attempt.time_taken_seconds)}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">Avg: {formatSeconds(avgTime)} / Question</div>
          </div>
        </div>

        {/* Per-Question Time Analysis Highlights */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Icons.Clock size={18} />
                Question Time Tracking & Speed Breakdown
              </h3>
              <p className="text-xs text-[#71717A]">
                Detailed measurement of seconds spent by the student on each question.
              </p>
            </div>
            <div className="text-xs font-mono text-[#A1A1AA]">
              Fastest: <strong className="text-white">{formatSeconds(minTime)}</strong> • Slowest: <strong className="text-white">{formatSeconds(maxTime)}</strong>
            </div>
          </div>

          {/* Quick horizontal bars comparing time spent */}
          <div className="space-y-2 pt-1">
            {answers.map((ans: any, idx: number) => {
              const sec = Number(ans.time_spent_seconds || 0)
              const pct = maxTime > 0 ? Math.max(10, Math.round((sec / maxTime) * 100)) : 10

              return (
                <div key={ans.answer_id} className="flex items-center gap-3 text-xs">
                  <span className="w-8 font-mono font-bold text-[#A1A1AA] shrink-0">
                    Q#{idx + 1}
                  </span>
                  <div className="flex-1 bg-[#181818] rounded-full h-3 overflow-hidden border border-[#262626]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        ans.is_correct === 1 ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono font-bold text-white shrink-0">
                    {formatSeconds(sec)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detailed Solutions & Step-by-Step Question Review */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Detailed Solutions & Explanations (व्याख्या)
          </h3>

          <div className="space-y-4">
            {answers.map((ans: any, idx: number) => {
              const isExpanded = expandedSolutions[ans.question_id]
              const isCorrect = ans.is_correct === 1
              const isUnanswered = !ans.selected_option_key

              let statusBadge = 'bg-white text-black font-bold'
              let statusText = 'Correct (+1.00)'
              if (isUnanswered) {
                statusBadge = 'bg-[#181818] text-[#71717A] border border-[#262626]'
                statusText = 'Unanswered (0.00)'
              } else if (!isCorrect) {
                statusBadge = 'bg-rose-950/70 text-rose-400 border border-rose-800/80'
                statusText = 'Incorrect (-0.25)'
              }

              return (
                <div
                  key={ans.answer_id}
                  className="rounded-2xl bg-[#111111] border border-[#262626] p-5 md:p-6 shadow-xs space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-lg bg-white text-black font-mono font-bold text-xs">
                        Question {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">{ans.subject_name}</span>
                      <span className="text-[#3F3F46]">•</span>
                      <span className="text-xs text-[#71717A]">{ans.topic_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Bookmark Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleBookmark(ans.question_id)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          bookmarkedQIds.has(ans.question_id)
                            ? 'bg-amber-400 text-black border-amber-500 shadow-xs'
                            : 'bg-[#161616] text-[#A1A1AA] hover:text-white hover:bg-[#202020] border-[#262626]'
                        }`}
                        title={
                          bookmarkedQIds.has(ans.question_id)
                            ? 'Question Bookmarked (सहेजा गया)'
                            : 'Bookmark this question for review (बुकमार्क करें)'
                        }
                      >
                        {bookmarkedQIds.has(ans.question_id) ? (
                          <Icons.BookmarkFilled size={13} className="text-black" />
                        ) : (
                          <Icons.Bookmark size={13} />
                        )}
                        <span className="hidden sm:inline">
                          {bookmarkedQIds.has(ans.question_id) ? 'Bookmarked' : 'Bookmark'}
                        </span>
                      </button>

                      {/* Exact Time Badge */}
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#161616] text-white border border-[#262626] flex items-center gap-1">
                        <Icons.Clock size={12} />
                        Time Spent: {formatSeconds(ans.time_spent_seconds)}
                      </span>

                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${statusBadge}`}>
                        {statusText}
                      </span>
                    </div>
                  </div>

                  {/* Question Statement (Bilingual support) */}
                  <div className="space-y-1.5">
                    <h4 className="text-base font-bold text-white leading-relaxed">
                      {ans.question_text}
                    </h4>
                    {ans.question_text_hi && ans.question_text_hi !== ans.question_text && (
                      <p className="text-sm font-semibold text-[#D4D4D8] leading-relaxed">
                        {ans.question_text_hi}
                      </p>
                    )}
                  </div>

                  {/* Options List (Styled with high-contrast Dark theme) */}
                  <div className="space-y-3 pt-1">
                    {ans.options?.map((opt: any) => {
                      const isSelectedByStudent = ans.selected_option_key === opt.key
                      const isOptionCorrect = Boolean(opt.isCorrect)

                      // 1. Correct Option (Green Card in Dark Mode)
                      if (isOptionCorrect) {
                        return (
                          <div
                            key={opt.key}
                            className="rounded-2xl border border-emerald-600/70 bg-emerald-950/30 overflow-hidden shadow-xs border-l-4 border-l-emerald-500 transition-all"
                          >
                            {/* Option Header */}
                            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full border border-emerald-500/80 bg-emerald-900/60 text-emerald-200 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                  {opt.key}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-emerald-200">
                                    {opt.text}
                                  </span>
                                  {opt.text_hi && opt.text_hi !== opt.text && (
                                    <span className="text-xs font-semibold text-emerald-300 mt-0.5">
                                      {opt.text_hi}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {isSelectedByStudent && (
                                  <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider hidden sm:inline">
                                    YOUR ANSWER
                                  </span>
                                )}
                                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-900/80 text-emerald-200 border border-emerald-700 flex items-center gap-1 shadow-2xs">
                                  <span>✓ CORRECT</span>
                                </span>
                              </div>
                            </div>

                            {/* Detailed Explanation Compartment beneath divider */}
                            {(ans.explanation || ans.explanation_hi) && (
                              <div className="px-4 py-3 bg-[#0C1710] border-t border-emerald-900/60 text-xs text-emerald-200 leading-relaxed font-medium space-y-1">
                                <span className="font-bold text-emerald-400 block mb-0.5 text-[11px] uppercase tracking-wider">
                                  Correct Explanation (सही उत्तर का स्पष्टीकरण):
                                </span>
                                {ans.explanation && <p>{ans.explanation}</p>}
                                {ans.explanation_hi && ans.explanation_hi !== ans.explanation && (
                                  <p className="pt-1 text-[#D4D4D8] border-t border-emerald-900/40">{ans.explanation_hi}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      }

                      // 2. Selected but Incorrect Option (Red Card in Dark Mode)
                      if (isSelectedByStudent && !isOptionCorrect) {
                        return (
                          <div
                            key={opt.key}
                            className="rounded-2xl border border-rose-700/70 bg-rose-950/30 overflow-hidden shadow-xs border-l-4 border-l-rose-500 transition-all"
                          >
                            {/* Option Header */}
                            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full border border-rose-500/80 bg-rose-900/60 text-rose-200 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                  {opt.key}
                                </span>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-rose-200">
                                    {opt.text}
                                  </span>
                                  {opt.text_hi && opt.text_hi !== opt.text && (
                                    <span className="text-xs font-semibold text-rose-300 mt-0.5">
                                      {opt.text_hi}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] font-bold uppercase text-rose-400 tracking-wider hidden sm:inline">
                                  YOUR ANSWER
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-900/80 text-rose-200 border border-rose-700 flex items-center gap-1 shadow-2xs">
                                  <span>✕ INCORRECT</span>
                                </span>
                              </div>
                            </div>

                            {/* Detailed Explanation Compartment beneath divider */}
                            <div className="px-4 py-3 bg-[#1A0D0F] border-t border-rose-900/60 text-xs text-rose-200 leading-relaxed font-medium">
                              <span className="font-bold text-rose-400 block mb-0.5 text-[11px] uppercase tracking-wider">
                                Incorrect Selection (गलत विकल्प):
                              </span>
                              <p>
                                आपने विकल्प ({opt.key}) चुना, जबकि सही उत्तर विकल्प ({ans.correct_option_key}) है।
                              </p>
                            </div>
                          </div>
                        )
                      }

                      // 3. Neutral Unselected Option
                      return (
                        <div
                          key={opt.key}
                          className="rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden text-xs text-[#FAFAFA] border-l-4 border-l-[#3F3F46]"
                        >
                          <div className="p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-full border border-[#303030] bg-[#1E1E1E] text-[#D4D4D8] font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                {opt.key}
                              </span>
                              <div className="flex flex-col">
                                <span className="font-semibold text-white text-sm">{opt.text}</span>
                                {opt.text_hi && opt.text_hi !== opt.text && (
                                  <span className="text-xs text-[#A1A1AA] mt-0.5">{opt.text_hi}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/practice"
            className="px-6 py-3 rounded-2xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-xs transition-colors shadow-xs"
          >
            Take Another Practice Test
          </Link>
          <Link
            href="/admin/results"
            className="px-6 py-3 rounded-2xl bg-[#161616] hover:bg-[#202020] border border-[#262626] text-white font-bold text-xs transition-colors"
          >
            Open Admin Analytics
          </Link>
        </div>
      </div>

      {/* Bookmarks Modal */}
      {attempt?.student_id && (
        <BookmarkModal
          isOpen={showBookmarksModal}
          onClose={() => setShowBookmarksModal(false)}
          studentId={attempt.student_id}
          onBookmarkRemoved={(qId) => {
            setBookmarkedQIds((prev) => {
              const next = new Set(prev)
              next.delete(qId)
              return next
            })
          }}
        />
      )}
    </div>
  )
}

