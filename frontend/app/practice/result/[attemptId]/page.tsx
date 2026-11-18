'use client'

import React, { useEffect, useState, useMemo, use } from 'react'
import Link from 'next/link'
import { ResultPageSkeleton } from '@/app/components/Shimmer'
import { Icons } from '@/components/admin/Icons'
import { ExamForgeLogo } from '@/components/brand'
import BookmarkModal from '@/components/student/BookmarkModal'

export default function ExamResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Expandable question solutions: record of question_id -> boolean
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({})

  // Question Bookmarks State
  const [bookmarkedQIds, setBookmarkedQIds] = useState<Set<number>>(new Set())
  const [showBookmarksModal, setShowBookmarksModal] = useState<boolean>(false)

  // Interactive Question Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'correct' | 'incorrect' | 'unanswered' | 'bookmarked'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')

  // Pagination & Navigator
  const [pageSize, setPageSize] = useState<number>(25)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showQuestionPalette, setShowQuestionPalette] = useState<boolean>(true)

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/student/attempts/${attemptId}`)
        const json = await res.json()

        if (!res.ok || !json.success) {
          setError(json.error || 'Failed to load examination result')
          return
        }

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
      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Error connecting to server')
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

  const toggleAllSolutions = (expand: boolean) => {
    if (!data?.answers) return
    const updated: Record<number, boolean> = {}
    data.answers.forEach((a: any) => {
      updated[a.question_id] = expand
    })
    setExpandedSolutions(updated)
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
    const s = Math.round(sec % 60)
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Topic Diagnostics computation
  const topicDiagnostics = useMemo(() => {
    if (!data?.answers || data.answers.length === 0) return []
    const map: Record<string, { topic: string; subject: string; total: number; correct: number; incorrect: number; unanswered: number; timeSpent: number }> = {}

    data.answers.forEach((a: any) => {
      const topicKey = a.topic_name || a.subject_name || 'General'
      if (!map[topicKey]) {
        map[topicKey] = {
          topic: a.topic_name || 'General',
          subject: a.subject_name || 'Core',
          total: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          timeSpent: 0,
        }
      }
      map[topicKey].total += 1
      map[topicKey].timeSpent += Number(a.time_spent_seconds || 0)
      if (a.is_correct === 1) map[topicKey].correct += 1
      else if (a.selected_option_key) map[topicKey].incorrect += 1
      else map[topicKey].unanswered += 1
    })

    return Object.values(map)
  }, [data?.answers])

  // Filtered answers
  const filteredAnswers = useMemo(() => {
    if (!data?.answers) return []

    return data.answers.filter((ans: any, idx: number) => {
      // 1. Status Filter
      if (filterStatus === 'correct' && ans.is_correct !== 1) return false
      if (filterStatus === 'incorrect' && (ans.is_correct === 1 || !ans.selected_option_key)) return false
      if (filterStatus === 'unanswered' && ans.selected_option_key) return false
      if (filterStatus === 'bookmarked' && !bookmarkedQIds.has(ans.question_id)) return false

      // 2. Topic Filter
      if (selectedTopic !== 'all' && (ans.topic_name || 'General') !== selectedTopic) return false

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const questionMatch =
          ans.question_text?.toLowerCase().includes(query) ||
          ans.question_text_hi?.toLowerCase().includes(query) ||
          ans.topic_name?.toLowerCase().includes(query) ||
          ans.subject_name?.toLowerCase().includes(query) ||
          `#${idx + 1}`.includes(query) ||
          `q${idx + 1}`.includes(query)
        if (!questionMatch) return false
      }

      return true
    })
  }, [data?.answers, filterStatus, selectedTopic, searchQuery, bookmarkedQIds])

  // Total pages
  const totalPages = Math.max(1, Math.ceil(filteredAnswers.length / pageSize))
  const paginatedAnswers = useMemo(() => {
    if (pageSize >= 9999) return filteredAnswers
    const start = (currentPage - 1) * pageSize
    return filteredAnswers.slice(start, start + pageSize)
  }, [filteredAnswers, currentPage, pageSize])

  // Jump directly to a question
  const handleJumpToQuestion = (questionOrderIndex: number) => {
    // Find index in filteredAnswers
    const foundIndex = filteredAnswers.findIndex((a: any) => a.order_index === questionOrderIndex || a.question_id === questionOrderIndex)
    if (foundIndex !== -1) {
      const targetPage = Math.floor(foundIndex / pageSize) + 1
      setCurrentPage(targetPage)
      setTimeout(() => {
        const el = document.getElementById(`question-card-${questionOrderIndex}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 80)
    }
  }

  if (loading) {
    return <ResultPageSkeleton />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#090909] text-[#FAFAFA] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center text-rose-400 mb-4">
          <Icons.Trash size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Examination Report Unavailable</h2>
        <p className="text-sm text-[#A1A1AA] max-w-md mb-6 leading-relaxed">
          {error || 'Unable to load the requested examination attempt result.'}
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/practice"
            className="px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-[#E4E4E7] transition-all"
          >
            Go to Practice Portal
          </Link>
          <Link
            href="/admin/results"
            className="px-5 py-2.5 rounded-xl bg-[#161616] border border-[#262626] text-[#A1A1AA] hover:text-white font-semibold text-xs transition-colors"
          >
            Admin Results
          </Link>
        </div>
      </div>
    )
  }

  const { attempt, answers = [] } = data

  // Time Analysis metrics
  const timesArray = answers.map((a: any) => Number(a.time_spent_seconds || 0))
  const maxTime = timesArray.length > 0 ? Math.max(...timesArray, 1) : 1
  const minTime = timesArray.length > 0 ? Math.min(...timesArray) : 0
  const avgTime =
    timesArray.length > 0
      ? Math.round(timesArray.reduce((a: number, b: number) => a + b, 0) / timesArray.length)
      : 0

  return (
    <div className="min-h-screen bg-[#090909] text-[#FAFAFA] font-sans pb-20 selection:bg-[#222222] selection:text-white print:bg-white print:text-black">
      {/* Header (Hidden when printing) */}
      <header className="sticky top-0 z-40 bg-[#0C0C0C]/90 backdrop-blur-md text-[#FAFAFA] px-4 md:px-8 py-3.5 border-b border-[#262626] flex items-center justify-between shadow-md print:hidden">
        <div className="flex items-center gap-3">
          <ExamForgeLogo variant="badge" size={18} className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="font-extrabold text-sm md:text-base leading-tight text-white flex items-center gap-2">
              <span>Examination Performance Report</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1C1C1C] text-[#A1A1AA] border border-[#2A2A2A]">
                Attempt #{attempt.id}
              </span>
            </h1>
            <div className="text-[10px] text-[#71717A] font-mono">
              Candidate: <strong className="text-[#D4D4D8]">{attempt.student_name}</strong> • Test ID: #{attempt.assessment_id}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Print / Export Report Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1E1E1E] text-[#D4D4D8] hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Print or Save Report as PDF"
          >
            <Icons.Printer size={13} />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          {/* Bookmarks Modal Button */}
          <button
            type="button"
            onClick={() => setShowBookmarksModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.BookmarkFilled
              size={13}
              className={bookmarkedQIds.size > 0 ? 'text-amber-400' : 'text-[#71717A]'}
            />
            <span className="hidden md:inline">Bookmarks</span>
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
            href="/admin/results"
            className="px-3.5 py-1.5 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-xs transition-colors shadow-xs"
          >
            Admin Results
          </Link>
        </div>
      </header>

      {/* Printable Header (Visible only when printed) */}
      <div className="hidden print:block p-6 border-b border-black text-black">
        <h1 className="text-2xl font-black">ExamForge Official Examination Scorecard</h1>
        <p className="text-xs text-neutral-600">
          Candidate: {attempt.student_name} • Test: {attempt.assessment_title} • Attempt #{attempt.id}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Top Scorecard Banner */}
        <div className="rounded-3xl bg-[#111111] border border-[#262626] p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 print:border-black print:bg-white print:text-black">
          <div className="space-y-2 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  attempt.passed
                    ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/80 print:bg-neutral-100 print:text-black'
                    : 'bg-amber-950/70 text-amber-400 border border-amber-800/80 print:bg-neutral-100 print:text-black'
                }`}
              >
                {attempt.passed ? '✓ PASSED EXAMINATION' : '⚠ RETAKE RECOMMENDED'}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#181818] border border-[#2A2A2A] text-[#A1A1AA] font-mono">
                Candidate: <strong className="text-white">{attempt.student_name}</strong>
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight print:text-black">
              {attempt.assessment_title}
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed max-w-2xl print:text-neutral-700">
              ExamForge Automated Diagnostic Report • Negative Marking (-0.25) • {answers.length} Total Questions
              Evaluated.
            </p>
          </div>

          {/* Large Score Metric Box */}
          <div className="flex items-center gap-5 bg-[#161616] p-5 rounded-2xl border border-[#262626] shrink-0 print:border-black print:bg-white">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-mono text-white print:text-black">
                {Number(attempt.obtained_marks).toFixed(2)}
              </div>
              <div className="text-[10px] font-bold text-[#71717A] uppercase mt-0.5">
                Marks of {Number(attempt.total_marks).toFixed(0)}
              </div>
            </div>
            <div className="h-10 w-px bg-[#262626] print:bg-black"></div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-black font-mono text-white print:text-black">
                {Number(attempt.percentage).toFixed(1)}%
              </div>
              <div className="text-[10px] font-bold text-[#71717A] uppercase mt-0.5">
                Score Percentage
              </div>
            </div>
          </div>
        </div>

        {/* 6 Key Performance Diagnostic Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 print:grid-cols-3">
          {/* Card 1: Correct */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Correct</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {attempt.correct_answers}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">+{attempt.correct_answers * 1.0} Marks</div>
          </div>

          {/* Card 2: Wrong */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">Wrong</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {attempt.incorrect_answers}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">
              -{Number(attempt.incorrect_answers * 0.25).toFixed(2)} Penalty
            </div>
          </div>

          {/* Card 3: Unanswered */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">Unanswered</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {attempt.unanswered_questions}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">0.00 Marks</div>
          </div>

          {/* Card 4: Accuracy */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-[11px] font-bold text-[#D4D4D8] uppercase tracking-wider">Accuracy</div>
            <div className="text-2xl font-black font-mono text-white mt-1">
              {Number(attempt.accuracy || 0).toFixed(0)}%
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">Net Precision</div>
          </div>

          {/* Card 5: Total Test Time */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-[11px] font-bold text-[#D4D4D8] uppercase tracking-wider">Time Taken</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {formatSeconds(attempt.time_taken_seconds)}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">Duration</div>
          </div>

          {/* Card 6: Average Pace */}
          <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] text-center shadow-xs">
            <div className="text-[11px] font-bold text-[#D4D4D8] uppercase tracking-wider">Avg Pace</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {formatSeconds(avgTime)}
            </div>
            <div className="text-[10px] text-[#A1A1AA] mt-0.5">Per Question</div>
          </div>
        </div>

        {/* Topic Diagnostics Breakdown Table / Cards */}
        {topicDiagnostics.length > 0 && (
          <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
              <div>
                <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <Icons.ListFilter size={16} />
                  Topic Diagnostic Performance Breakdown
                </h3>
                <p className="text-xs text-[#71717A]">
                  Subject and topic-level accuracy, speed, and question counts for Attempt #{attempt.id}.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#2A2A2A] text-[#A1A1AA]">
                {topicDiagnostics.length} Topics Tested
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {topicDiagnostics.map((t, i) => {
                const topicAccuracy =
                  t.correct + t.incorrect > 0
                    ? Math.round((t.correct / (t.correct + t.incorrect)) * 100)
                    : 0
                const avgTopicSec = t.total > 0 ? Math.round(t.timeSpent / t.total) : 0

                return (
                  <div
                    key={i}
                    onClick={() => setSelectedTopic(selectedTopic === t.topic ? 'all' : t.topic)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      selectedTopic === t.topic
                        ? 'bg-[#1C1C1C] border-white ring-1 ring-white/20'
                        : 'bg-[#141414] border-[#262626] hover:bg-[#1A1A1A] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-white truncate max-w-[170px]">
                        {t.topic}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#202020] text-[#D4D4D8] border border-[#303030]">
                        {topicAccuracy}% Acc
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#A1A1AA] pt-1">
                      <span>{t.total} Questions</span>
                      <span className="text-emerald-400 font-mono font-bold">+{t.correct}</span>
                      <span className="text-rose-400 font-mono font-bold">-{t.incorrect}</span>
                      <span className="text-[#71717A] font-mono">0: {t.unanswered}</span>
                      <span className="font-mono text-[10px] text-[#D4D4D8]">{avgTopicSec}s avg</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Interactive Question Palette / Navigator (Jump Matrix) */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5 shadow-xs space-y-4 print:hidden">
          <div className="flex items-center justify-between border-b border-[#262626] pb-3">
            <div>
              <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span>Interactive Question Navigator (प्रश्न संख्या मैट्रिक्स)</span>
                <span className="text-[10px] font-mono text-[#71717A]">
                  (1 - {answers.length})
                </span>
              </h3>
              <p className="text-xs text-[#71717A]">
                Click any question box to jump directly to its complete solution and explanation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowQuestionPalette(!showQuestionPalette)}
                className="px-2.5 py-1 rounded-lg bg-[#161616] border border-[#2A2A2A] text-xs font-medium text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
              >
                {showQuestionPalette ? 'Hide Matrix' : 'Show Matrix'}
              </button>
            </div>
          </div>

          {showQuestionPalette && (
            <div className="space-y-3">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-400"></span>
                  <span className="text-[#A1A1AA]">Correct ({attempt.correct_answers})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-rose-500 border border-rose-400"></span>
                  <span className="text-[#A1A1AA]">Incorrect ({attempt.incorrect_answers})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#242424] border border-[#3A3A3A]"></span>
                  <span className="text-[#A1A1AA]">Unanswered ({attempt.unanswered_questions})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs border-2 border-amber-400 bg-[#161616]"></span>
                  <span className="text-[#A1A1AA]">Bookmarked ({bookmarkedQIds.size})</span>
                </div>
              </div>

              {/* Number Grid */}
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 lg:grid-cols-20 gap-1.5 max-h-48 overflow-y-auto p-1.5 bg-[#0D0D0D] rounded-xl border border-[#202020]">
                {answers.map((ans: any, idx: number) => {
                  const isCorrect = ans.is_correct === 1
                  const isWrong = !isCorrect && ans.selected_option_key
                  const isBookmarked = bookmarkedQIds.has(ans.question_id)

                  let bgStyle = 'bg-[#181818] text-[#71717A] border-[#2A2A2A]'
                  if (isCorrect) {
                    bgStyle = 'bg-emerald-600 text-white font-bold border-emerald-500'
                  } else if (isWrong) {
                    bgStyle = 'bg-rose-600 text-white font-bold border-rose-500'
                  }

                  return (
                    <button
                      key={ans.question_id || idx}
                      type="button"
                      onClick={() => handleJumpToQuestion(idx + 1)}
                      className={`h-7 rounded-md font-mono text-[10px] flex items-center justify-center border transition-all cursor-pointer relative hover:scale-105 ${bgStyle} ${
                        isBookmarked ? 'ring-2 ring-amber-400' : ''
                      }`}
                      title={`Q#${idx + 1}: ${isCorrect ? 'Correct' : isWrong ? 'Incorrect' : 'Unanswered'}`}
                    >
                      {idx + 1}
                      {isBookmarked && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5"></span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Question Solutions Section Header with Interactive Filters */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#262626] pb-4">
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>Detailed Question Review & Explanations</span>
                <span className="text-xs font-mono font-normal text-[#A1A1AA]">
                  (Showing {filteredAnswers.length} of {answers.length} Questions)
                </span>
              </h3>
              <p className="text-xs text-[#71717A]">
                Comprehensive Hindi & English bilingual explanations with option diagnostics.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => toggleAllSolutions(true)}
                className="px-2.5 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1E1E1E] text-xs font-medium text-[#D4D4D8] transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => toggleAllSolutions(false)}
                className="px-2.5 py-1.5 rounded-xl bg-[#141414] border border-[#262626] hover:bg-[#1E1E1E] text-xs font-medium text-[#A1A1AA] transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Interactive Filtering Toolbar */}
          <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
              {/* Search input */}
              <div className="relative w-full sm:w-64">
                <Icons.Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"
                />
                <input
                  type="text"
                  placeholder="Search question # or text..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {(
                  [
                    { id: 'all', label: `All (${answers.length})` },
                    { id: 'correct', label: `Correct (${attempt.correct_answers})` },
                    { id: 'incorrect', label: `Wrong (${attempt.incorrect_answers})` },
                    { id: 'unanswered', label: `Skipped (${attempt.unanswered_questions})` },
                    { id: 'bookmarked', label: `Bookmarks (${bookmarkedQIds.size})` },
                  ] as const
                ).map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => {
                      setFilterStatus(pill.id)
                      setCurrentPage(1)
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                      filterStatus === pill.id
                        ? 'bg-white text-black font-bold'
                        : 'bg-[#151515] text-[#A1A1AA] border border-[#262626] hover:text-white'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
              <span className="text-[11px] font-mono text-[#71717A]">Page Size:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="px-2 py-1 rounded-lg border border-[#262626] bg-[#151515] text-[#FAFAFA] font-mono text-xs focus:outline-none cursor-pointer"
              >
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
                <option value={100}>100 / page</option>
                <option value={99999}>View All ({answers.length})</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators */}
          {(filterStatus !== 'all' || selectedTopic !== 'all' || searchQuery) && (
            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="text-[#71717A]">Active Filters:</span>
              {filterStatus !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-[#1C1C1C] border border-[#333333] text-white flex items-center gap-1 font-mono text-[11px]">
                  Status: {filterStatus}
                  <button
                    type="button"
                    onClick={() => setFilterStatus('all')}
                    className="ml-1 text-[#71717A] hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {selectedTopic !== 'all' && (
                <span className="px-2 py-0.5 rounded-md bg-[#1C1C1C] border border-[#333333] text-white flex items-center gap-1 font-mono text-[11px]">
                  Topic: {selectedTopic}
                  <button
                    type="button"
                    onClick={() => setSelectedTopic('all')}
                    className="ml-1 text-[#71717A] hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 rounded-md bg-[#1C1C1C] border border-[#333333] text-white flex items-center gap-1 font-mono text-[11px]">
                  Search: &quot;{searchQuery}&quot;
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="ml-1 text-[#71717A] hover:text-white"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('all')
                  setSelectedTopic('all')
                  setSearchQuery('')
                }}
                className="text-[11px] text-amber-400 underline hover:text-amber-300 ml-1"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Questions Cards List */}
          {paginatedAnswers.length === 0 ? (
            <div className="rounded-2xl bg-[#111111] border border-[#262626] p-12 text-center text-[#71717A] space-y-2">
              <Icons.Search size={28} className="mx-auto text-[#444444]" />
              <div className="text-sm font-semibold text-white">No Questions Matching Criteria</div>
              <p className="text-xs max-w-sm mx-auto">
                Try selecting a different filter pill or clearing the search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('all')
                  setSelectedTopic('all')
                  setSearchQuery('')
                }}
                className="mt-2 px-4 py-1.5 rounded-xl bg-[#202020] hover:bg-[#2A2A2A] text-white font-semibold text-xs border border-[#303030] cursor-pointer"
              >
                Show All {answers.length} Questions
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {paginatedAnswers.map((ans: any) => {
                // Determine original index (1-based)
                const originalIndex =
                  answers.findIndex((a: any) => a.question_id === ans.question_id) + 1 ||
                  ans.order_index ||
                  1
                const isExpanded = expandedSolutions[ans.question_id] ?? true
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
                    id={`question-card-${originalIndex}`}
                    className="rounded-2xl bg-[#111111] border border-[#262626] p-5 md:p-6 shadow-xs space-y-4 transition-all print:border-black print:bg-white print:text-black"
                  >
                    {/* Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626] print:border-neutral-300">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-white text-black font-mono font-bold text-xs print:bg-neutral-200">
                          Question #{originalIndex}
                        </span>
                        <span className="text-xs font-bold text-white print:text-black">
                          {ans.subject_name || 'Core Exam'}
                        </span>
                        {ans.topic_name && (
                          <>
                            <span className="text-[#3F3F46]">•</span>
                            <span className="text-xs text-[#71717A] print:text-neutral-600">
                              {ans.topic_name}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Bookmark Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleBookmark(ans.question_id)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer print:hidden ${
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
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#161616] text-white border border-[#262626] flex items-center gap-1 print:border-neutral-300 print:bg-neutral-100 print:text-black">
                          <Icons.Clock size={12} />
                          {formatSeconds(ans.time_spent_seconds)}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${statusBadge}`}
                        >
                          {statusText}
                        </span>

                        {/* Toggle Explanation Accordion Button */}
                        <button
                          type="button"
                          onClick={() => toggleSolution(ans.question_id)}
                          className="p-1 rounded-lg hover:bg-[#202020] text-[#71717A] hover:text-white transition-colors print:hidden cursor-pointer"
                          title="Toggle Explanation"
                        >
                          <Icons.ChevronDown
                            size={16}
                            className={`transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Question Statement (Bilingual support) */}
                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-white leading-relaxed print:text-black">
                        {ans.question_text}
                      </h4>
                      {ans.question_text_hi && ans.question_text_hi !== ans.question_text && (
                        <p className="text-sm font-semibold text-[#D4D4D8] leading-relaxed print:text-neutral-800">
                          {ans.question_text_hi}
                        </p>
                      )}
                    </div>

                    {/* Options List */}
                    <div className="space-y-3 pt-1">
                      {ans.options?.map((opt: any) => {
                        const isSelectedByStudent = ans.selected_option_key === opt.key
                        const isOptionCorrect = Boolean(opt.isCorrect)

                        // 1. Correct Option (Green Card in Dark Mode)
                        if (isOptionCorrect) {
                          return (
                            <div
                              key={opt.key}
                              className="rounded-2xl border border-emerald-600/70 bg-emerald-950/30 overflow-hidden shadow-xs border-l-4 border-l-emerald-500 transition-all print:border-emerald-700 print:bg-emerald-50"
                            >
                              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-full border border-emerald-500/80 bg-emerald-900/60 text-emerald-200 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                    {opt.key}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-emerald-200 print:text-emerald-950">
                                      {opt.text}
                                    </span>
                                    {opt.text_hi && opt.text_hi !== opt.text && (
                                      <span className="text-xs font-semibold text-emerald-300 print:text-emerald-900 mt-0.5">
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

                              {/* Explanation Compartment */}
                              {isExpanded && (ans.explanation || ans.explanation_hi) && (
                                <div className="px-4 py-3 bg-[#0C1710] border-t border-emerald-900/60 text-xs text-emerald-200 leading-relaxed font-medium space-y-1 print:bg-white print:border-emerald-200 print:text-neutral-900">
                                  <span className="font-bold text-emerald-400 print:text-emerald-800 block mb-0.5 text-[11px] uppercase tracking-wider">
                                    Correct Explanation (सही उत्तर का स्पष्टीकरण):
                                  </span>
                                  {ans.explanation && <p>{ans.explanation}</p>}
                                  {ans.explanation_hi && ans.explanation_hi !== ans.explanation && (
                                    <p className="pt-1 text-[#D4D4D8] print:text-neutral-800 border-t border-emerald-900/40">
                                      {ans.explanation_hi}
                                    </p>
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
                              className="rounded-2xl border border-rose-700/70 bg-rose-950/30 overflow-hidden shadow-xs border-l-4 border-l-rose-500 transition-all print:border-rose-700 print:bg-rose-50"
                            >
                              <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="w-7 h-7 rounded-full border border-rose-500/80 bg-rose-900/60 text-rose-200 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                    {opt.key}
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-bold text-rose-200 print:text-rose-950">
                                      {opt.text}
                                    </span>
                                    {opt.text_hi && opt.text_hi !== opt.text && (
                                      <span className="text-xs font-semibold text-rose-300 print:text-rose-900 mt-0.5">
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

                              {/* Error explanation compartment */}
                              {isExpanded && (
                                <div className="px-4 py-3 bg-[#1A0D0F] border-t border-rose-900/60 text-xs text-rose-200 leading-relaxed font-medium print:bg-white print:border-rose-200 print:text-neutral-900">
                                  <span className="font-bold text-rose-400 print:text-rose-800 block mb-0.5 text-[11px] uppercase tracking-wider">
                                    Incorrect Selection (गलत विकल्प):
                                  </span>
                                  <p>
                                    आपने विकल्प ({opt.key}) चुना, जबकि सही उत्तर विकल्प (
                                    {ans.correct_option_key}) है।
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        }

                        // 3. Neutral Unselected Option
                        return (
                          <div
                            key={opt.key}
                            className="rounded-2xl border border-[#262626] bg-[#141414] overflow-hidden text-xs text-[#FAFAFA] border-l-4 border-l-[#3F3F46] print:bg-white print:border-neutral-300 print:text-black"
                          >
                            <div className="p-3.5 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full border border-[#303030] bg-[#1E1E1E] text-[#D4D4D8] font-mono font-bold text-xs flex items-center justify-center shrink-0 print:bg-neutral-100 print:text-black">
                                  {opt.key}
                                </span>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-white print:text-black text-sm">
                                    {opt.text}
                                  </span>
                                  {opt.text_hi && opt.text_hi !== opt.text && (
                                    <span className="text-xs text-[#A1A1AA] print:text-neutral-700 mt-0.5">
                                      {opt.text_hi}
                                    </span>
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
          )}

          {/* Bottom Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
              <div className="text-xs font-mono text-[#71717A]">
                Showing page <strong className="text-white">{currentPage}</strong> of{' '}
                <strong className="text-white">{totalPages}</strong> ({filteredAnswers.length}{' '}
                questions filtered)
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.max(1, p - 1))
                    window.scrollTo({ top: 350, behavior: 'smooth' })
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-[#262626] bg-[#161616] text-xs font-semibold text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#202020] transition-colors cursor-pointer"
                >
                  Previous
                </button>

                {/* Page number buttons */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1]
                    const showEllipsis = prevP && p - prevP > 1

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && <span className="text-[#52525B] px-1 font-mono">...</span>}
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPage(p)
                            window.scrollTo({ top: 350, behavior: 'smooth' })
                          }}
                          className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                            currentPage === p
                              ? 'bg-white text-black'
                              : 'bg-[#161616] border border-[#262626] text-[#A1A1AA] hover:text-white'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    )
                  })}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                    window.scrollTo({ top: 350, behavior: 'smooth' })
                  }}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-[#262626] bg-[#161616] text-xs font-semibold text-[#FAFAFA] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#202020] transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons at Bottom */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-6 print:hidden">
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
