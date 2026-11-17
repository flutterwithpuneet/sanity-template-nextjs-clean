'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/admin/Icons'
import { TestCatalogSkeleton } from '@/app/components/Shimmer'

export default function StudentPracticePortalPage() {
  const [assessments, setAssessments] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [currentStudent, setCurrentStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')

  // Candidate quick login modal / name switch
  const [newStudentName, setNewStudentName] = useState('')
  const [showSwitchModal, setShowSwitchModal] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [resTests, resStudents] = await Promise.all([
        fetch('/api/student/assessments').then((r) => r.json()),
        fetch('/api/student/profile').then((r) => r.json()),
      ])
      if (resTests.success) setAssessments(resTests.assessments)
      if (resStudents.success && resStudents.students.length > 0) {
        setStudents(resStudents.students)
        const savedStudent = typeof window !== 'undefined' ? localStorage.getItem('examforge_current_student') : null
        if (savedStudent) {
          try {
            const parsed = JSON.parse(savedStudent)
            const matched = resStudents.students.find((s: any) => s.id === parsed.id)
            if (matched) {
              setCurrentStudent(matched)
            } else {
              setCurrentStudent(resStudents.students[0])
              localStorage.setItem('examforge_current_student', JSON.stringify(resStudents.students[0]))
            }
          } catch {
            setCurrentStudent(resStudents.students[0])
            localStorage.setItem('examforge_current_student', JSON.stringify(resStudents.students[0]))
          }
        } else {
          setCurrentStudent(resStudents.students[0])
          localStorage.setItem('examforge_current_student', JSON.stringify(resStudents.students[0]))
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRegisterOrSelect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStudentName.trim()) return

    try {
      const res = await fetch('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: newStudentName.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setCurrentStudent(json.student)
        if (typeof window !== 'undefined') {
          localStorage.setItem('examforge_current_student', JSON.stringify(json.student))
        }
        setShowSwitchModal(false)
        setNewStudentName('')
        loadData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filteredTests = assessments.filter((t) => {
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()) || (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesType = filterType === 'all' || t.assessment_type === filterType
    return matchesSearch && matchesType
  })

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              EF
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                ExamForge <span className="text-blue-600">Practice</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Rajasthan Informatics Assistant Portal
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Candidate Status Card */}
            {currentStudent && (
              <div className="flex items-center gap-2.5 bg-slate-100/80 border border-slate-200/90 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                  {currentStudent.full_name?.charAt(0) || 'P'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-slate-900 text-xs leading-tight">
                    {currentStudent.full_name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Candidate #{currentStudent.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 ml-1 font-semibold hover:underline"
                >
                  Switch
                </button>
              </div>
            )}

            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 shadow-xs transition-all hover:scale-[1.02]"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Modern Welcome Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-800 text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-xs text-white border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Exam Preparation Portal</span>
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white">
                Namaste, {currentStudent?.full_name || 'Candidate'} 👋
              </h1>

              <p className="text-xs sm:text-sm text-blue-100 leading-relaxed max-w-lg">
                Target Rajasthan Informatics Assistant with real-time countdown, negative marking (+1.00 / -0.25), question palette, and comprehensive question-level time analytics.
              </p>
            </div>

            {/* Quick Metrics Badge */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 text-center min-w-[120px]">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">{assessments.length}</div>
                <div className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider mt-0.5">Live Mock Tests</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/20 text-center min-w-[120px]">
                <div className="text-2xl sm:text-3xl font-extrabold text-white">0.25</div>
                <div className="text-[10px] font-semibold text-blue-100 uppercase tracking-wider mt-0.5">Negative Mark</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Tests' },
              { id: 'mock', label: 'Full Mocks' },
              { id: 'practice', label: 'Practice Drills' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterType === f.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <input
              type="text"
              placeholder="Search tests by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
            <svg
              className="absolute left-3 top-2.5 text-slate-400"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold">Showing {filteredTests.length} assessment{filteredTests.length === 1 ? '' : 's'}</span>
            <span className="text-[11px] font-medium">Rajasthan RSMSSB Exam Standard</span>
          </div>

          {loading ? (
            <TestCatalogSkeleton />
          ) : filteredTests.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="text-3xl">📝</div>
              <h3 className="font-bold text-slate-800 text-sm">No tests found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No assessments matched your query. Try clearing filters or create a new test in the Admin Panel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTests.map((test) => (
                <div
                  key={test.id}
                  className="rounded-3xl bg-white border border-slate-200/90 p-6 shadow-xs hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Header badge row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                        {test.assessment_type || 'Mock Exam'}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                        Pass: {test.passing_percentage}%
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {test.title}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {test.description || 'Full coverage of Rajasthan Informatics Assistant exam syllabus questions.'}
                    </p>
                  </div>

                  {/* Stats Pill & CTA */}
                  <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 rounded-2xl p-3 border border-slate-100">
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{test.total_questions}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold mt-0.5">Questions</div>
                      </div>
                      <div className="border-x border-slate-200/60">
                        <div className="font-extrabold text-slate-900 text-sm">{test.duration_minutes}m</div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold mt-0.5">Duration</div>
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm">{Number(test.total_marks || 0).toFixed(0)}</div>
                        <div className="text-[10px] uppercase text-slate-400 font-semibold mt-0.5">Total Marks</div>
                      </div>
                    </div>

                    <Link
                      href={`/practice/${test.id}`}
                      onClick={() => {
                        if (currentStudent && typeof window !== 'undefined') {
                          localStorage.setItem('examforge_current_student', JSON.stringify(currentStudent))
                        }
                      }}
                      className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs group-hover:shadow-md"
                    >
                      <span>Start Practice Test</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Switch Candidate Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Select Candidate Profile</h3>
                <p className="text-xs text-slate-500">Pick an existing candidate or register a new name</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-sm transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Existing Candidates:
              </span>
              {students.map((st) => (
                <button
                  key={st.id}
                  onClick={() => {
                    setCurrentStudent(st)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('examforge_current_student', JSON.stringify(st))
                    }
                    setShowSwitchModal(false)
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    currentStudent?.id === st.id
                      ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-bold'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {st.full_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="font-bold text-xs">{st.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Candidate #{st.id}</div>
                    </div>
                  </div>
                  {currentStudent?.id === st.id && (
                    <span className="text-xs font-bold text-blue-600">Active ✓</span>
                  )}
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100">
              <form onSubmit={handleRegisterOrSelect} className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Or Add New Candidate:
                </span>
                <input
                  type="text"
                  placeholder="Full Name (e.g. Puneet Sharma)"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
                >
                  Save & Switch
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
