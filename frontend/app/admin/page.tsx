'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/admin/Icons'

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({
    stats: {
      totalStudents: 0,
      totalSubjects: 0,
      totalTopics: 0,
      totalQuestions: 0,
      approvedQuestions: 0,
      pendingQuestions: 0,
      totalMockTests: 0,
      totalAttempts: 0,
      pendingReports: 0,
      avgScore: 0,
      avgAccuracy: 0,
    },
    subjectStats: [],
    recentQuestions: [],
    recentAttempts: [],
  })

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/dashboard')
      const json = await res.json()
      if (json.success) {
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
  }, [])

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#111111] text-[#FAFAFA] p-6 md:p-8 border border-[#262626]">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[#151515] border border-[#262626] text-[#A1A1AA] mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FAFAFA] animate-pulse"></span>
              Live Database Connected • MySQL 5.5
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#FAFAFA]">
              ExamForge Admin Overview
            </h1>
            <p className="text-xs md:text-sm text-[#A1A1AA] mt-1 max-w-2xl leading-relaxed">
              Rajasthan Informatics Assistant Question Bank, Hierarchical Syllabus Tree & Candidate Practice Management.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/questions?action=new"
              className="px-4 py-2 rounded-xl bg-[#FAFAFA] text-[#090909] font-semibold text-xs hover:bg-[#E4E4E7] transition-colors flex items-center gap-2"
            >
              <Icons.Plus size={15} />
              Add Question
            </Link>
            <Link
              href="/practice"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-[#171717] text-[#FAFAFA] font-medium text-xs border border-[#262626] hover:bg-[#202020] hover:border-[#3F3F46] transition-colors flex items-center gap-2"
            >
              <Icons.CandidatePortal size={15} />
              Student Portal
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          {
            label: 'Total Students',
            value: data.stats.totalStudents,
            href: '/admin/students',
            icon: Icons.Students,
          },
          {
            label: 'Active Subjects',
            value: data.stats.totalSubjects,
            href: '/admin/subjects',
            icon: Icons.Subjects,
          },
          {
            label: 'Syllabus Topics',
            value: data.stats.totalTopics,
            href: '/admin/topics',
            icon: Icons.Topics,
          },
          {
            label: 'Total Questions',
            value: data.stats.totalQuestions,
            href: '/admin/questions',
            icon: Icons.Questions,
          },
          {
            label: 'Approved Bank',
            value: data.stats.approvedQuestions,
            href: '/admin/questions?status=approved',
            icon: Icons.CheckCircle,
          },
          {
            label: 'Mock Tests',
            value: data.stats.totalMockTests,
            href: '/admin/practice-tests',
            icon: Icons.PracticeTests,
          },
        ].map((item, idx) => {
          const IconComp = item.icon
          return (
            <Link
              key={idx}
              href={item.href}
              className="p-4 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#3F3F46] hover:bg-[#151515] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
                  {item.label}
                </span>
                <div className="p-1.5 rounded-lg bg-[#171717] border border-[#262626] text-[#71717A] group-hover:text-[#FAFAFA] group-hover:border-[#3F3F46] transition-colors">
                  <IconComp size={15} />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">
                {loading ? '...' : item.value}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Secondary Performance Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#151515] border border-[#262626] flex items-center justify-center font-bold text-sm text-[#FAFAFA] font-mono shrink-0">
            {loading ? '-' : `${data.stats.avgScore}%`}
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium text-[#71717A] uppercase">Average Score</div>
            <div className="text-xs font-semibold text-[#FAFAFA]">Across test submissions</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#151515] border border-[#262626] flex items-center justify-center font-bold text-sm text-[#FAFAFA] font-mono shrink-0">
            {loading ? '-' : `${data.stats.avgAccuracy}%`}
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium text-[#71717A] uppercase">Platform Accuracy</div>
            <div className="text-xs font-semibold text-[#FAFAFA]">Correct vs attempted</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#151515] border border-[#262626] flex items-center justify-center font-bold text-sm text-[#FAFAFA] font-mono shrink-0">
            {loading ? '-' : data.stats.totalAttempts}
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium text-[#71717A] uppercase">Test Attempts</div>
            <div className="text-xs font-semibold text-[#FAFAFA]">Candidate practice runs</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#151515] border border-[#262626] flex items-center justify-center font-bold text-sm text-[#FAFAFA] font-mono shrink-0">
            {loading ? '-' : data.stats.pendingReports}
          </div>
          <div>
            <div className="text-[10px] font-mono font-medium text-[#71717A] uppercase">Question Flags</div>
            <div className="text-xs font-semibold text-[#FAFAFA]">
              <Link href="/admin/reports" className="text-[#A1A1AA] hover:text-[#FAFAFA] underline underline-offset-2">
                Review student reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Subject Statistics & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subject wise Question Distribution (2 Columns) */}
        <div className="lg:col-span-2 rounded-2xl bg-[#111111] border border-[#262626] p-5 sm:p-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#1F1F1F] mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#FAFAFA]">Subject-wise Bank Distribution</h2>
              <p className="text-xs text-[#71717A]">Live question coverage across syllabus subjects</p>
            </div>
            <Link
              href="/admin/subjects"
              className="text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1 transition-colors"
            >
              Manage Subjects <Icons.ChevronRight size={13} />
            </Link>
          </div>

          <div className="divide-y divide-[#1F1F1F]">
            {data.subjectStats.map((sub: any) => {
              const totalQ = sub.question_count || 0
              const approvedQ = sub.approved_count || 0
              const pct = totalQ > 0 ? Math.round((approvedQ / totalQ) * 100) : 0

              return (
                <div key={sub.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-[#FAFAFA]">{sub.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#151515] text-[#A1A1AA] border border-[#262626]">
                        {sub.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#71717A] mt-1 font-mono">
                      <span>{sub.topic_count || 0} Topics</span>
                      <span>•</span>
                      <span>{totalQ} Questions ({approvedQ} approved)</span>
                    </div>
                  </div>

                  <div className="w-32 sm:w-36 flex flex-col items-end">
                    <div className="text-[11px] font-mono font-medium text-[#A1A1AA] mb-1">{pct}% Approved</div>
                    <div className="w-full bg-[#1F1F1F] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#FAFAFA] h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Candidate Test Attempts (1 Column) */}
        <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5 sm:p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#1F1F1F] mb-4">
            <div>
              <h2 className="text-sm font-bold text-[#FAFAFA]">Recent Submissions</h2>
              <p className="text-xs text-[#71717A]">Candidate test attempts & scores</p>
            </div>
            <Link
              href="/admin/results"
              className="text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1 transition-colors"
            >
              All Results <Icons.ChevronRight size={13} />
            </Link>
          </div>

          <div className="space-y-3 flex-1">
            {data.recentAttempts.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#71717A]">
                No candidate attempts recorded yet.<br />
                Launch the student portal to take practice tests.
              </div>
            ) : (
              data.recentAttempts.map((att: any) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl border border-[#262626] bg-[#151515] hover:border-[#3F3F46] transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-[#FAFAFA] truncate max-w-[150px]">
                      {att.student_name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        att.passed
                          ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                          : 'bg-[#1F1F1F] text-[#A1A1AA] border border-[#262626]'
                      }`}
                    >
                      {att.passed ? 'PASSED' : 'RETRY'}
                    </span>
                  </div>
                  <div className="text-xs text-[#A1A1AA] truncate mb-2">{att.assessment_title}</div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#71717A] border-t border-[#1F1F1F] pt-1.5">
                    <span>Score: {Number(att.obtained_marks).toFixed(1)} / {Number(att.total_marks).toFixed(1)}</span>
                    <span className="font-bold text-[#FAFAFA]">{Number(att.percentage).toFixed(0)}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recently Added Questions */}
      <div className="rounded-2xl bg-[#111111] border border-[#262626] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#1F1F1F] mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#FAFAFA]">Recently Added Questions</h2>
            <p className="text-xs text-[#71717A]">Latest additions to the question repository</p>
          </div>
          <Link
            href="/admin/questions"
            className="text-xs font-semibold text-[#A1A1AA] hover:text-[#FAFAFA] flex items-center gap-1 transition-colors"
          >
            Manage Question Bank <Icons.ChevronRight size={13} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {data.recentQuestions.map((q: any) => (
            <div
              key={q.id}
              className="p-4 rounded-xl border border-[#262626] bg-[#151515] hover:border-[#3F3F46] transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#FAFAFA]">{q.subject_name}</span>
                  <span className="text-[10px] text-[#52525B]">•</span>
                  <span className="text-xs text-[#A1A1AA]">{q.topic_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#191919] text-[#A1A1AA] border border-[#262626]">
                    {q.language_code || 'en'}
                  </span>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#202020] text-[#FAFAFA] border border-[#3F3F46]">
                    {q.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-xs font-medium text-[#FAFAFA] line-clamp-2 leading-relaxed">{q.question_text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
