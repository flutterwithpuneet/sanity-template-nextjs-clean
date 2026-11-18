'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { TableSkeleton } from '@/app/components/Shimmer'

export default function ResultsAnalyticsPage() {
  const [attempts, setAttempts] = useState<any[]>([])
  const [rankings, setRankings] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>({
    accuracyBreakdown: { correct: 0, incorrect: 0, unanswered: 0, total: 0 },
    speedBreakdown: { fast: 0, moderate: 0, heavy: 0, avgSeconds: 0 },
    topicPerformance: [],
  })
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed'>('all')

  // Detailed modal drilldown
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null)
  const [drilldownLoading, setDrilldownLoading] = useState(false)
  const [drilldownData, setDrilldownData] = useState<any>(null)

  // Delete confirmation
  const [deleteAttemptId, setDeleteAttemptId] = useState<number | null>(null)

  const fetchResults = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/results')
      const json = await res.json()
      if (json.success) {
        setAttempts(json.attempts)
        setRankings(json.rankings)
        if (json.analytics) {
          setAnalytics(json.analytics)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const handleOpenDrilldown = async (attemptId: number) => {
    setSelectedAttemptId(attemptId)
    setDrilldownLoading(true)
    try {
      const res = await fetch(`/api/admin/results?attempt_id=${attemptId}`)
      const json = await res.json()
      if (json.success) {
        setDrilldownData(json)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDrilldownLoading(false)
    }
  }

  const handleDeleteAttempt = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/results?attempt_id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteAttemptId(null)
        if (selectedAttemptId === id) setSelectedAttemptId(null)
        fetchResults()
      } else {
        alert(json.error || 'Failed to delete attempt')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0s'
    const m = Math.floor(sec / 60)
    const s = Math.round(sec % 60)
    if (m === 0) return `${s}s`
    return `${m}m ${s}s`
  }

  // Filtered attempts
  const filteredAttempts = attempts.filter((att) => {
    const matchesSearch =
      att.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.assessment_title?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'passed' && att.passed === 1) ||
      (statusFilter === 'failed' && att.passed === 0)
    return matchesSearch && matchesStatus
  })

  // Calculations for Pie/Donut charts
  const totalAcc =
    (analytics.accuracyBreakdown.correct || 0) +
    (analytics.accuracyBreakdown.incorrect || 0) +
    (analytics.accuracyBreakdown.unanswered || 0)
  const pctCorrect = totalAcc > 0 ? Math.round((analytics.accuracyBreakdown.correct / totalAcc) * 100) : 0
  const pctIncorrect = totalAcc > 0 ? Math.round((analytics.accuracyBreakdown.incorrect / totalAcc) * 100) : 0
  const pctUnanswered = totalAcc > 0 ? Math.round((analytics.accuracyBreakdown.unanswered / totalAcc) * 100) : 0

  const totalSpeed =
    (analytics.speedBreakdown.fast || 0) +
    (analytics.speedBreakdown.moderate || 0) +
    (analytics.speedBreakdown.heavy || 0)
  const pctFast = totalSpeed > 0 ? Math.round((analytics.speedBreakdown.fast / totalSpeed) * 100) : 0
  const pctModerate = totalSpeed > 0 ? Math.round((analytics.speedBreakdown.moderate / totalSpeed) * 100) : 0
  const pctHeavy = totalSpeed > 0 ? Math.round((analytics.speedBreakdown.heavy / totalSpeed) * 100) : 0

  // SVG Donut slice calculation helper
  const renderDonutSlices = (slices: { pct: number; color: string }[]) => {
    const radius = 38
    const circumference = 2 * Math.PI * radius
    let accumulatedPct = 0

    return slices.map((slice, i) => {
      const strokeDash = (slice.pct / 100) * circumference
      const strokeOffset = circumference - (accumulatedPct / 100) * circumference
      accumulatedPct += slice.pct

      return (
        <circle
          key={i}
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke={slice.color}
          strokeWidth="14"
          strokeDasharray={`${strokeDash} ${circumference}`}
          strokeDashoffset={strokeOffset}
          className="transition-all duration-700 ease-out"
        />
      )
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="rounded-2xl bg-[#111111] border border-[#262626] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase bg-[#151515] text-[#A1A1AA] border border-[#262626] mb-2">
            <span>Visual Performance & Speed Analytics</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
            Results & Candidate Analytics
          </h1>
          <p className="text-xs md:text-sm text-[#71717A] mt-1 max-w-xl leading-relaxed">
            Live accuracy distributions, pie charts, speed benchmarking, and per-question time analysis.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchResults}
            className="px-3.5 py-2 rounded-xl bg-[#171717] border border-[#262626] hover:bg-[#202020] hover:border-[#3F3F46] text-[#FAFAFA] text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Icons.Clock size={14} />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* Top Visual Charts Grid (3 Analytics Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Chart 1: Accuracy Pie / Donut Chart */}
        <div className="bg-[#111111] rounded-2xl border border-[#262626] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAFAFA]">
                Accuracy Breakdown (Pie Chart)
              </h2>
              <p className="text-[11px] text-[#71717A]">Correct vs Incorrect responses</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#151515] border border-[#262626] text-[#FAFAFA]">
              {pctCorrect}% Net
            </span>
          </div>

          <div className="py-4 flex items-center justify-center gap-6">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1F1F1F" strokeWidth="14" />
                {renderDonutSlices([
                  { pct: pctCorrect, color: '#FAFAFA' },
                  { pct: pctIncorrect, color: '#71717A' },
                  { pct: pctUnanswered, color: '#3F3F46' },
                ])}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold font-mono text-[#FAFAFA]">{pctCorrect}%</span>
                <span className="text-[9px] uppercase font-mono font-medium text-[#71717A]">Accuracy</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FAFAFA]"></span>
                <span className="text-[#A1A1AA]">Correct:</span>
                <strong className="font-mono text-[#FAFAFA]">{analytics.accuracyBreakdown.correct} ({pctCorrect}%)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#71717A]"></span>
                <span className="text-[#A1A1AA]">Wrong:</span>
                <strong className="font-mono text-[#FAFAFA]">{analytics.accuracyBreakdown.incorrect} ({pctIncorrect}%)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3F3F46]"></span>
                <span className="text-[#A1A1AA]">Skipped:</span>
                <strong className="font-mono text-[#FAFAFA]">{analytics.accuracyBreakdown.unanswered} ({pctUnanswered}%)</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1F1F1F] text-[10px] text-[#71717A] font-mono text-center">
            Total {totalAcc} Questions Evaluated
          </div>
        </div>

        {/* Chart 2: Speed / Time Investment Donut Chart */}
        <div className="bg-[#111111] rounded-2xl border border-[#262626] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAFAFA]">
                Speed Distribution (Pie Chart)
              </h2>
              <p className="text-[11px] text-[#71717A]">Time spent per question tier</p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#151515] border border-[#262626] text-[#FAFAFA]">
              Avg: {analytics.speedBreakdown.avgSeconds}s
            </span>
          </div>

          <div className="py-4 flex items-center justify-center gap-6">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#1F1F1F" strokeWidth="14" />
                {renderDonutSlices([
                  { pct: pctFast, color: '#FAFAFA' },
                  { pct: pctModerate, color: '#71717A' },
                  { pct: pctHeavy, color: '#3F3F46' },
                ])}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-base font-bold font-mono text-[#FAFAFA]">
                  {analytics.speedBreakdown.avgSeconds}s
                </span>
                <span className="text-[9px] uppercase font-mono font-medium text-[#71717A]">Avg Pace</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#FAFAFA]"></span>
                <span className="text-[#A1A1AA]">⚡ &lt;20s:</span>
                <strong className="font-mono text-[#FAFAFA]">{analytics.speedBreakdown.fast} ({pctFast}%)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#71717A]"></span>
                <span className="text-[#A1A1AA]">⏱️ 20-45s:</span>
                <strong className="font-mono text-[#FAFAFA]">{analytics.speedBreakdown.moderate} ({pctModerate}%)</strong>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#3F3F46]"></span>
                <span className="text-[#A1A1AA]">⏳ &gt;45s:</span>
                <strong className="font-mono text-[#FAFAFA]">{analytics.speedBreakdown.heavy} ({pctHeavy}%)</strong>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#1F1F1F] text-[10px] text-[#71717A] font-mono text-center">
            Pacing: {pctFast >= 50 ? 'Rapid Candidate Pace' : 'Balanced Candidate Pace'}
          </div>
        </div>

        {/* Chart 3: Syllabus Topic Performance Bars */}
        <div className="bg-[#111111] rounded-2xl border border-[#262626] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F]">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#FAFAFA]">
                Topic Diagnostic Matrix
              </h2>
              <p className="text-[11px] text-[#71717A]">Accuracy & seconds per topic</p>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#191919] border border-[#3F3F46] text-[#FAFAFA]">
              Live
            </span>
          </div>

          <div className="py-2 space-y-3">
            {analytics.topicPerformance.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#71717A]">
                No topic attempts logged yet.
              </div>
            ) : (
              analytics.topicPerformance.map((top: any, idx: number) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#FAFAFA] truncate max-w-[140px]">
                      {top.topic_name}
                    </span>
                    <span className="font-mono text-[#71717A] text-[11px]">
                      {top.accuracy_pct}% • {top.avg_seconds}s
                    </span>
                  </div>
                  <div className="w-full bg-[#1F1F1F] rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#FAFAFA] h-full rounded-full transition-all duration-500"
                      style={{ width: `${top.accuracy_pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-2 border-t border-[#1F1F1F] text-[10px] text-[#71717A] font-mono text-center">
            Strength & Weak Topics Tracker
          </div>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Icons.Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            placeholder="Search candidate or test title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'passed', 'failed'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl font-mono font-semibold uppercase text-[10px] transition-colors ${
                statusFilter === filter
                  ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                  : 'bg-[#151515] text-[#71717A] border border-[#262626] hover:text-[#FAFAFA]'
              }`}
            >
              {filter === 'all' ? 'All Submissions' : filter === 'passed' ? 'Passed' : 'Needs Retake'}
            </button>
          ))}
          <span className="text-xs font-mono font-medium text-[#71717A] ml-2">
            {filteredAttempts.length} Records
          </span>
        </div>
      </div>

      {/* Main Attempts Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden">
        <div className="p-4 bg-[#151515] border-b border-[#262626] flex items-center justify-between text-[11px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
          <span>Submitted Student Test Attempts</span>
          <span>Click analyze for timing breakdown</span>
        </div>

        {loading ? (
          <TableSkeleton cols={6} rows={5} />
        ) : filteredAttempts.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#71717A]">
            No submissions matching filter. Take a test in the Student Portal to generate analytics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151515] border-b border-[#262626] text-[10px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
                  <th className="py-3 px-4">Attempt #</th>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Practice Test</th>
                  <th className="py-3 px-4 text-center">Score</th>
                  <th className="py-3 px-4 text-center">Accuracy</th>
                  <th className="py-3 px-4 text-center">Total Time</th>
                  <th className="py-3 px-4 text-center">Outcome</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F] text-xs text-[#FAFAFA]">
                {filteredAttempts.map((att) => (
                  <tr key={att.id} className="hover:bg-[#151515]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#FAFAFA]">
                      #{att.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#191919] border border-[#3F3F46] text-[#FAFAFA] flex items-center justify-center font-bold font-mono text-xs shrink-0">
                          {att.student_name ? att.student_name.charAt(0) : 'P'}
                        </div>
                        <div>
                          <div className="font-semibold text-[#FAFAFA]">{att.student_name}</div>
                          <div className="text-[10px] text-[#71717A] font-mono">{att.student_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#FAFAFA] max-w-xs truncate">
                        {att.assessment_title}
                      </div>
                      <div className="text-[10px] text-[#71717A] uppercase font-mono">
                        {att.assessment_type || 'practice'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      {Number(att.obtained_marks).toFixed(1)} / {Number(att.total_marks).toFixed(1)}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold">
                      {Number(att.accuracy || 0).toFixed(0)}%
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-[#A1A1AA] font-semibold">
                      {formatSeconds(att.time_taken_seconds)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[9px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                          att.passed === 1
                            ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                            : 'bg-[#151515] text-[#71717A] border border-[#262626]'
                        }`}
                      >
                        {att.passed === 1 ? 'PASSED' : 'RETRY'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenDrilldown(att.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#171717] border border-[#262626] hover:bg-[#202020] hover:border-[#3F3F46] text-[#FAFAFA] font-medium text-xs transition-colors flex items-center gap-1"
                        >
                          <span>Analyze</span>
                          <Icons.ChevronRight size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteAttemptId(att.id)}
                          className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Delete Attempt Record"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Advanced Per-Question Timing & Diagnostic Drilldown Modal */}
      <Modal
        isOpen={selectedAttemptId !== null}
        onClose={() => setSelectedAttemptId(null)}
        title="Candidate Diagnostic & Per-Question Timing Breakdown"
        subtitle="Detailed analysis of time spent per question, candidate options, and solutions"
        maxWidth="2xl"
      >
        {drilldownLoading || !drilldownData ? (
          <div className="p-4"><TableSkeleton cols={4} rows={4} /></div>
        ) : (
          <div className="space-y-5">
            {/* Summary strip */}
            <div className="p-4 rounded-2xl bg-[#151515] border border-[#262626] text-[#FAFAFA] flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold tracking-tight text-[#FAFAFA]">
                  {drilldownData.attempt?.student_name}
                </div>
                <div className="text-xs text-[#71717A]">
                  {drilldownData.attempt?.assessment_title}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[#71717A] block text-[9px] uppercase">Score</span>
                  <strong className="text-[#FAFAFA] text-xs">
                    {Number(drilldownData.attempt?.obtained_marks).toFixed(1)} / {Number(drilldownData.attempt?.total_marks).toFixed(1)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#71717A] block text-[9px] uppercase">Accuracy</span>
                  <strong className="text-[#FAFAFA] text-xs">
                    {Number(drilldownData.attempt?.accuracy || 0).toFixed(0)}%
                  </strong>
                </div>
                <div>
                  <span className="text-[#71717A] block text-[9px] uppercase">Total Time</span>
                  <strong className="text-[#FAFAFA] text-xs">
                    {formatSeconds(drilldownData.attempt?.time_taken_seconds)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Per-Question Timing & Answer Table */}
            <div className="border border-[#262626] rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#151515] border-b border-[#262626] font-mono text-[10px] text-[#71717A] uppercase sticky top-0 z-10">
                    <th className="py-2.5 px-3">Q#</th>
                    <th className="py-2.5 px-3">Question Statement</th>
                    <th className="py-2.5 px-3 text-center">Selected</th>
                    <th className="py-2.5 px-3 text-center">Correct</th>
                    <th className="py-2.5 px-3 text-center">Time Spent</th>
                    <th className="py-2.5 px-3 text-center">Speed</th>
                    <th className="py-2.5 px-3 text-center">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F1F1F]">
                  {drilldownData.answers?.map((ans: any, idx: number) => {
                    const timeSpent = Number(ans.time_spent_seconds || 0)
                    let speedTag = 'Balanced'
                    let speedBadge = 'bg-[#151515] text-[#A1A1AA] border border-[#262626]'
                    if (timeSpent > 0 && timeSpent < 20) {
                      speedTag = '⚡ Fast (<20s)'
                      speedBadge = 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                    } else if (timeSpent >= 45) {
                      speedTag = '⏳ Heavy (>45s)'
                      speedBadge = 'bg-[#151515] text-[#71717A] border border-[#262626]'
                    }

                    return (
                      <tr key={ans.answer_id} className="hover:bg-[#151515]/60 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#FAFAFA]">{idx + 1}</td>
                        <td className="py-3 px-3 max-w-[200px]">
                          <div className="font-medium text-[#FAFAFA] line-clamp-2">{ans.question_text}</div>
                          <div className="text-[10px] text-[#71717A] mt-0.5">{ans.topic_name}</div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#A1A1AA]">
                          {ans.selected_option_key || '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#FAFAFA]">
                          {ans.correct_option_key || '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-semibold text-[#FAFAFA]">
                          {formatSeconds(timeSpent)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${speedBadge}`}>
                            {speedTag}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold">
                          {ans.is_correct === 1 ? (
                            <span className="text-[#FAFAFA]">+{Number(ans.marks_awarded || 1).toFixed(1)}</span>
                          ) : ans.selected_option_key ? (
                            <span className="text-[#71717A]">-{Number(ans.negative_marks || 0.25).toFixed(2)}</span>
                          ) : (
                            <span className="text-[#52525B]">0.0</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Actions in drilldown */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F]">
              <button
                type="button"
                onClick={() => setDeleteAttemptId(drilldownData.attempt?.id)}
                className="px-3 py-1.5 rounded-xl border border-[#262626] bg-[#151515] text-xs font-medium text-red-400 hover:bg-red-950/30 flex items-center gap-1.5 transition-colors"
              >
                <Icons.Trash size={13} />
                <span>Delete Attempt</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedAttemptId(null)}
                className="px-5 py-2 rounded-xl bg-[#FAFAFA] text-[#090909] text-xs font-semibold hover:bg-[#E4E4E7] transition-colors"
              >
                Close Analysis
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteAttemptId !== null}
        onClose={() => setDeleteAttemptId(null)}
        title="Delete Test Attempt Record"
        subtitle="Confirm removal of candidate test submission"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Are you sure you want to delete this test attempt? All associated question time logs and score records will be permanently removed.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteAttemptId(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#202020] hover:text-[#FAFAFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteAttemptId && handleDeleteAttempt(deleteAttemptId)}
              className="px-4 py-2 rounded-xl bg-red-950/40 text-red-400 border border-red-900/40 hover:bg-red-900/50 hover:text-red-300 text-xs font-medium transition-colors"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
