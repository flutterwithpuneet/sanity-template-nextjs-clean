'use client'

import React, { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icons } from '@/components/admin/Icons'
import { ExamForgeLogo } from '@/components/brand'
import BookmarkModal from '@/components/student/BookmarkModal'
import StudentResultsModal from '@/components/student/StudentResultsModal'

interface SubjectItem {
  id: string
  name: string
  code: string
  description?: string
  icon?: string
  tests_count: string | number
  low_tests_count: string | number
  medium_tests_count: string | number
  high_tests_count: string | number
}

interface AssessmentItem {
  id: number
  title: string
  slug: string
  description?: string
  assessment_type: string
  duration_minutes: number
  total_questions: number
  total_marks: number
  passing_percentage: number
  difficulty_level: string
  subject_id: number | null
  subject_name: string | null
  subject_code: string | null
  exam_name?: string
}

// 6 Available Subjects as defined in specification
const CORE_SUBJECT_OPTIONS = [
  {
    id: 'all',
    name: 'All Subjects (सम्पूर्ण)',
    hindiName: 'सम्पूर्ण पाठ्यक्रम',
    code: 'ALL',
    description: 'Comprehensive practice questions combined across all exam syllabus subjects.',
  },
  {
    id: '1',
    name: 'Computer & Information Technology',
    hindiName: 'कंप्यूटर एवं सूचना प्रौद्योगिकी',
    code: 'CIT',
    description: 'Algorithms, Flowcharts, Hardware, Software, Networking, DBMS & Office Tools.',
  },
  {
    id: '2',
    name: 'Reasoning & Mental Ability',
    hindiName: 'तार्किक योग्यता एवं मानसिक क्षमता',
    code: 'RMA',
    description: 'Blood Relations, Coding-Decoding, Series, Direction, Analogy & Logic Puzzles.',
  },
  {
    id: '3',
    name: 'Mathematics',
    hindiName: 'गणित (अंकगणित)',
    code: 'MATH',
    description: 'Percentage, Profit & Loss, Average, Ratio & Proportion, Time & Work, SI & CI.',
  },
  {
    id: '4',
    name: 'General Knowledge (GK)',
    hindiName: 'सामान्य ज्ञान (राजस्थान व भारत)',
    code: 'GK',
    description: 'Rajasthan Heritage, History, Geography, Polity, Current Affairs & General Science.',
  },
  {
    id: 'full_mock',
    name: 'Full-Length Mock Tests',
    hindiName: 'सम्पूर्ण मॉक टेस्ट (परीक्षा पैटर्न)',
    code: 'FULL',
    description: 'Complete official exam pattern drill covering full syllabus under timed conditions.',
  },
]

const DIFFICULTY_OPTIONS = [
  {
    id: 'easy',
    name: 'Easy (सरल)',
    hindiName: 'सरल स्तर',
    subtitle: 'Basic concept questions',
    description: 'Fundamental syllabus questions focusing on core concepts, definitions, and direct recall.',
  },
  {
    id: 'medium',
    name: 'Medium (मध्यम)',
    hindiName: 'मध्यम स्तर',
    subtitle: 'Standard examination questions',
    description: 'Standard examination difficulty matching previous official Rajasthan Informatics Assistant papers.',
  },
  {
    id: 'hard',
    name: 'Hard (कठिन)',
    hindiName: 'कठिन स्तर',
    subtitle: 'Advanced analytical questions',
    description: 'Complex multi-step problems, advanced technical logic, and in-depth analytical drills.',
  },
]

function PracticePortalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize state synchronously from searchParams to avoid step-jumping or layout flash on refresh
  const initialStep = useMemo<1 | 2 | 3>(() => {
    const s = searchParams.get('step')
    if (s === '3') return 3
    if (s === '2') return 2
    return 1
  }, [searchParams])

  const initialSubject = useMemo<string>(() => {
    const sub = searchParams.get('subject')
    if (sub && CORE_SUBJECT_OPTIONS.some((s) => s.id === sub)) return sub
    return 'all'
  }, [searchParams])

  const initialDiff = useMemo<'easy' | 'medium' | 'hard' | null>(() => {
    const diff = searchParams.get('diff')
    if (diff === 'easy' || diff === 'medium' || diff === 'hard') return diff
    return null
  }, [searchParams])

  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [currentStudent, setCurrentStudent] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('examforge_current_student')
        return saved ? JSON.parse(saved) : null
      } catch {
        return null
      }
    }
    return null
  })
  const [loading, setLoading] = useState(true)

  // 3-Step Guided Flow State (1: Subject, 2: Difficulty, 3: Practice Test)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(initialStep)

  // Step 1: Selected Subject
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubject)

  // Step 2: Selected Difficulty Level
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(initialDiff)

  // Step 3: Search filter for tests
  const [searchQuery, setSearchQuery] = useState('')

  // Bookmark management state
  const [showBookmarksModal, setShowBookmarksModal] = useState(false)
  const [bookmarkCount, setBookmarkCount] = useState<number>(0)

  // My Results modal state
  const [showResultsModal, setShowResultsModal] = useState(false)

  // Sync state if browser back/forward buttons change searchParams
  useEffect(() => {
    setCurrentStep(initialStep)
    setSelectedSubjectId(initialSubject)
    setSelectedDifficulty(initialDiff)
  }, [initialStep, initialSubject, initialDiff])

  // Fetch bookmarks count when current student is selected
  useEffect(() => {
    if (!currentStudent?.id) return
    let active = true
    fetch(`/api/student/bookmarks?student_id=${currentStudent.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (active && data.success) {
          setBookmarkCount(data.count || 0)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [currentStudent?.id, showBookmarksModal])

  // Fetch assessments, subjects, and student profile
  const loadData = async () => {
    try {
      setLoading(true)
      const [resProfile, resTests, resSubs] = await Promise.all([
        fetch('/api/student/profile').then((r) => r.json()),
        fetch('/api/student/assessments').then((r) => r.json()),
        fetch('/api/student/subjects').then((r) => r.json()),
      ])

      if (resProfile.success && resProfile.student) {
        setCurrentStudent(resProfile.student)
      } else if (resProfile.code === 'UNAUTHENTICATED' || resTests.code === 'UNAUTHENTICATED') {
        router.push('/login?redirect=/practice')
        return
      }

      if (resTests.success) {
        setAssessments(resTests.assessments || [])
      }

      if (resSubs.success && resSubs.subjects?.length > 0) {
        setSubjects(resSubs.subjects)
      }
    } catch (err) {
      console.error('Error loading practice portal data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Sync navigation state with browser history URL
  const updateUrlParams = (step: 1 | 2 | 3, subId: string, diff: string | null) => {
    const params = new URLSearchParams()
    params.set('step', String(step))
    if (subId) params.set('subject', subId)
    if (diff) params.set('diff', diff)
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.pushState({ step, subId, diff }, '', newUrl)
  }

  // Normalizer helper: maps difficulty to 'easy', 'medium', or 'hard'
  const normalizeDiff = (d?: string): 'easy' | 'medium' | 'hard' => {
    const val = (d || 'medium').toLowerCase()
    if (val === 'low' || val === 'easy') return 'easy'
    if (val === 'high' || val === 'hard') return 'hard'
    return 'medium'
  }

  // Calculate dynamic test counts for all 6 subjects
  const subjectTestCounts = useMemo(() => {
    const map: Record<string, number> = {
      all: assessments.length,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      full_mock: 0,
    }

    assessments.forEach((t) => {
      if (t.subject_id === null) {
        map['full_mock'] = (map['full_mock'] || 0) + 1
      } else {
        const subIdStr = String(t.subject_id)
        map[subIdStr] = (map[subIdStr] || 0) + 1
      }
    })

    return map
  }, [assessments])

  // Count tests in currently selected subject for each difficulty level
  const difficultyCounts = useMemo(() => {
    const scoped = assessments.filter((t) => {
      if (selectedSubjectId === 'full_mock') return t.subject_id === null
      if (selectedSubjectId !== 'all') return String(t.subject_id) === String(selectedSubjectId)
      return true
    })

    return {
      all: scoped.length,
      easy: scoped.filter((t) => normalizeDiff(t.difficulty_level) === 'easy').length,
      medium: scoped.filter((t) => normalizeDiff(t.difficulty_level) === 'medium').length,
      hard: scoped.filter((t) => normalizeDiff(t.difficulty_level) === 'hard').length,
    }
  }, [assessments, selectedSubjectId])

  // Get active subject metadata
  const activeSubject = useMemo(() => {
    return CORE_SUBJECT_OPTIONS.find((s) => s.id === selectedSubjectId) || CORE_SUBJECT_OPTIONS[0]
  }, [selectedSubjectId])

  // Filter assessments strictly for Step 3
  const finalFilteredAssessments = useMemo(() => {
    return assessments.filter((test) => {
      // 1. Subject match
      if (selectedSubjectId === 'full_mock') {
        if (test.subject_id !== null) return false
      } else if (selectedSubjectId !== 'all') {
        if (String(test.subject_id) !== String(selectedSubjectId)) return false
      }

      // 2. Difficulty match
      if (selectedDifficulty) {
        const testDiff = normalizeDiff(test.difficulty_level)
        if (testDiff !== selectedDifficulty) return false
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = test.title?.toLowerCase().includes(q)
        const matchDesc = test.description?.toLowerCase().includes(q)
        const matchSubject = test.subject_name?.toLowerCase().includes(q)
        if (!matchTitle && !matchDesc && !matchSubject) return false
      }

      return true
    })
  }, [assessments, selectedSubjectId, selectedDifficulty, searchQuery])

  // Navigation handlers
  const handleProceedToStep2 = () => {
    if (!selectedSubjectId) return
    setCurrentStep(2)
    updateUrlParams(2, selectedSubjectId, selectedDifficulty)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleProceedToStep3 = () => {
    if (!selectedDifficulty) return
    setCurrentStep(3)
    updateUrlParams(3, selectedSubjectId, selectedDifficulty)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToStep1 = () => {
    setCurrentStep(1)
    updateUrlParams(1, selectedSubjectId, selectedDifficulty)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBackToStep2 = () => {
    setCurrentStep(2)
    updateUrlParams(2, selectedSubjectId, selectedDifficulty)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#101010] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#222222] selection:text-[#FFFFFF]">
      {/* 1. Header — Soft Monochrome Dark */}
      <header className="sticky top-0 z-40 bg-[#101010] border-b border-[#303030]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <Link href="/" className="flex items-center gap-3 group">
            <ExamForgeLogo variant="badge" size={20} className="w-9 h-9 rounded-xl group-hover:border-[#FAFAFA]/40 transition-colors" />
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#FFFFFF] block leading-tight">
                ExamForge Practice Portal
              </span>
              <span className="text-[10px] text-[#737373] font-medium hidden sm:block">
                Rajasthan Informatics Assistant Online Test Series
              </span>
            </div>
          </Link>

          {/* Right Header Navigation: Candidate info & Admin link */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {currentStudent && (
              <button
                type="button"
                onClick={() => setShowResultsModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] text-xs font-semibold text-[#FAFAFA] transition-colors cursor-pointer group"
                title="View your completed test submissions & reports"
              >
                <span className="text-xs">📊</span>
                <span className="hidden sm:inline">My Results</span>
              </button>
            )}

            {currentStudent && (
              <button
                type="button"
                onClick={() => setShowBookmarksModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] border border-[#303030] text-xs font-semibold text-[#FAFAFA] transition-colors cursor-pointer group"
                title="View your saved question bookmarks"
              >
                <Icons.BookmarkFilled size={14} className="text-white group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Bookmarks</span>
                <span className="px-1.5 py-0.2 rounded-full bg-white text-black font-mono font-black text-[10px]">
                  {bookmarkCount}
                </span>
              </button>
            )}

            {currentStudent && (
              <div className="flex items-center gap-2.5 bg-[#1C1C1C] border border-[#303030] px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-[#FFFFFF] text-[#111111] font-black flex items-center justify-center text-[10px]">
                  {currentStudent.full_name?.charAt(0) || 'C'}
                </div>
                <div className="hidden md:block text-left">
                  <div className="font-bold text-[#FFFFFF] text-xs leading-tight">
                    {currentStudent.full_name}
                  </div>
                  <div className="text-[9px] text-[#737373] font-mono">
                    {currentStudent.role === 'admin' ? '🛡️ Administrator' : `Student @${currentStudent.username}`}
                  </div>
                </div>
              </div>
            )}

            {currentStudent?.role === 'admin' && (
              <Link
                href="/admin"
                className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] text-[#111111] text-xs font-bold hover:bg-[#E5E5E5] transition-colors shadow-sm"
              >
                Admin Panel
              </Link>
            )}

            <a
              href="/api/auth/logout"
              title="Sign Out"
              className="p-1.5 rounded-xl text-[#737373] hover:text-[#FAFAFA] hover:bg-[#1C1C1C] border border-[#303030] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Practice Layout */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Unauthorized alert banner */}
        {searchParams.get('error') === 'unauthorized' && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800 text-red-300 text-xs flex items-center gap-2.5">
            <span className="text-base">🚫</span>
            <span>
              <strong>Access Denied:</strong> Administrative routes and APIs are restricted exclusively to verified administrators.
            </span>
          </div>
        )}

        {/* Empty assignments notice */}
        {!loading && assessments.length === 0 && (
          <div className="p-6 rounded-2xl bg-[#171717] border border-[#2E2E2E] text-center space-y-2">
            <div className="text-2xl">📋</div>
            <h3 className="text-sm font-bold text-white">No Mock Tests Currently Assigned</h3>
            <p className="text-xs text-[#A3A3A3] max-w-md mx-auto">
              Your student account does not have any active mock test assignments yet. Administrators assign specific mock tests to individual candidates. Please contact your instructor or administrator to grant test access.
            </p>
          </div>
        )}
        {/* Top Statistics Bar — Compact Dark Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#303030] text-left">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#737373] block mb-1">
              Total Drills
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#FFFFFF]">
              {loading ? (
                <span className="inline-block w-20 h-7 bg-[#2A2A2A] rounded-lg animate-pulse" />
              ) : (
                `${assessments.length} Tests`
              )}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#303030] text-left">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#737373] block mb-1">
              Marking Scheme
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#FFFFFF]">
              +1.0 / -0.25
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#303030] text-left">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#737373] block mb-1">
              Selected Subject
            </span>
            <div className="text-sm sm:text-base font-bold text-[#FFFFFF] truncate" title={activeSubject.name}>
              {activeSubject.name}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#303030] text-left">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#737373] block mb-1">
              Active Level
            </span>
            <div className="text-sm sm:text-base font-bold text-[#FFFFFF] uppercase">
              {selectedDifficulty || 'Not Chosen'}
            </div>
          </div>
        </div>

        {/* 3. Three-Step Progress Indicator (Non-clickable visual indicator) */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#171717] border border-[#303030]">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold select-none">
            {/* Step 1 Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-default ${
                currentStep === 1
                  ? 'bg-[#202020] text-white border border-[#3F3F46] font-bold shadow-xs'
                  : currentStep > 1
                  ? 'text-[#FFFFFF]'
                  : 'text-[#737373]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                  currentStep === 1
                    ? 'bg-[#D4D4D8] text-[#111111]'
                    : currentStep > 1
                    ? 'bg-[#303030] text-[#FFFFFF]'
                    : 'bg-[#222222] text-[#737373]'
                }`}
              >
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span>Step 1 — Subject</span>
            </div>

            <span className="text-[#303030] font-bold">→</span>

            {/* Step 2 Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-default ${
                currentStep === 2
                  ? 'bg-[#202020] text-white border border-[#3F3F46] font-bold shadow-xs'
                  : currentStep > 2
                  ? 'text-[#FFFFFF]'
                  : 'text-[#737373]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                  currentStep === 2
                    ? 'bg-[#D4D4D8] text-[#111111]'
                    : currentStep > 2
                    ? 'bg-[#303030] text-[#FFFFFF]'
                    : 'bg-[#222222] text-[#737373]'
                }`}
              >
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span>Step 2 — Difficulty</span>
            </div>

            <span className="text-[#303030] font-bold">→</span>

            {/* Step 3 Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-default ${
                currentStep === 3
                  ? 'bg-[#202020] text-white border border-[#3F3F46] font-bold shadow-xs'
                  : 'text-[#737373]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                  currentStep === 3
                    ? 'bg-[#D4D4D8] text-[#111111]'
                    : 'bg-[#222222] text-[#737373]'
                }`}
              >
                3
              </span>
              <span>Step 3 — Practice Test</span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: CHOOSE SUBJECT (केवल विषय चयन स्क्रीन)                */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Step Header */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1C1C1C] border border-[#303030] text-[#A3A3A3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></span>
                Step 1 of 3
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#FFFFFF] tracking-tight">
                Choose Your Subject
              </h1>
              <p className="text-sm text-[#A3A3A3]">
                Select a subject to start your practice journey.
              </p>
            </div>

            {/* 6 Subject Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CORE_SUBJECT_OPTIONS.map((sub) => {
                const isSelected = selectedSubjectId === sub.id
                const testCount = subjectTestCounts[sub.id] || 0

                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectId(sub.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                      isSelected
                        ? 'bg-[#202020] text-[#FAFAFA] border-2 border-white shadow-xl ring-1 ring-white/20'
                        : 'bg-[#141414] text-[#FAFAFA] border-[#262626] hover:bg-[#1A1A1A] hover:border-[#383838]'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Abbrev badge & Available test count */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#2E2E2E] text-white border border-[#444444]'
                              : 'bg-[#1E1E1E] text-[#A1A1AA] border border-[#2B2B2B]'
                          }`}
                        >
                          {sub.code}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold ${
                            isSelected ? 'text-[#FAFAFA]' : 'text-[#71717A]'
                          }`}
                        >
                          {loading ? (
                            <span className="inline-block w-16 h-3 bg-[#333333] rounded animate-pulse" />
                          ) : (
                            `${testCount} Tests Available`
                          )}
                        </span>
                      </div>

                      {/* Subject Name & Hindi Name */}
                      <h3
                        className="text-base font-extrabold leading-tight mb-1 text-[#FFFFFF]"
                      >
                        {sub.name}
                      </h3>
                      <p
                        className={`text-xs font-medium mb-3 ${
                          isSelected ? 'text-[#D4D4D8]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {sub.hindiName}
                      </p>

                      {/* Description */}
                      <p
                        className={`text-xs leading-relaxed ${
                          isSelected ? 'text-[#E4E4E7]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {sub.description}
                      </p>
                    </div>

                    {/* Bottom Selected Indicator */}
                    <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs font-bold ${
                      isSelected ? 'border-[#383838] text-white' : 'border-[#262626] text-[#71717A]'
                    }`}>
                      <span>{isSelected ? '✓ Selected' : 'Click to select'}</span>
                      <Icons.ChevronRight size={14} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions: Continue Button */}
            <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
              <span className="text-xs text-[#737373]">
                Selected: <strong className="text-[#FFFFFF]">{activeSubject.name}</strong>
              </span>

              <button
                type="button"
                onClick={handleProceedToStep2}
                disabled={!selectedSubjectId}
                className="px-6 py-3 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continue to Step 2</span>
                <Icons.ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: CHOOSE DIFFICULTY (केवल कठिनाई स्तर स्क्रीन)          */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Step Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1C1C1C] border border-[#303030] text-[#A3A3A3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></span>
                  Step 2 of 3
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-[#1C1C1C] border border-[#303030] text-[#FFFFFF] font-semibold">
                  Subject: <strong className="text-[#FFFFFF]">{activeSubject.name}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#FFFFFF] tracking-tight">
                Choose Difficulty Level
              </h1>
              <p className="text-sm text-[#A3A3A3]">
                Select the difficulty level for your practice in {activeSubject.name}.
              </p>
            </div>

            {/* 3 Large Difficulty Cards (Desktop: 3 cols, Mobile: stacked) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {DIFFICULTY_OPTIONS.map((diff) => {
                const isSelected = selectedDifficulty === diff.id
                const testCount = difficultyCounts[diff.id as 'easy' | 'medium' | 'hard'] || 0

                return (
                  <div
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id as 'easy' | 'medium' | 'hard')}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                      isSelected
                        ? 'bg-[#202020] text-[#FAFAFA] border-2 border-white shadow-xl ring-1 ring-white/20'
                        : 'bg-[#141414] text-[#FAFAFA] border-[#262626] hover:bg-[#1A1A1A] hover:border-[#383838]'
                    }`}
                  >
                    <div>
                      {/* Top Header: Radio / Badge & Count */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-white' : 'border-[#52525B]'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </span>
                          <span
                            className={`text-xs font-mono uppercase font-bold tracking-wider ${
                              isSelected ? 'text-white' : 'text-[#A1A1AA]'
                            }`}
                          >
                            {diff.id}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#2E2E2E] text-white border border-[#444444]'
                              : 'bg-[#1E1E1E] text-[#A1A1AA] border border-[#2B2B2B]'
                          }`}
                        >
                          {loading ? (
                            <span className="inline-block w-12 h-3 bg-[#333333] rounded animate-pulse" />
                          ) : (
                            `${testCount} Tests`
                          )}
                        </span>
                      </div>

                      {/* Difficulty Title */}
                      <h3
                        className="text-xl font-black mb-1 text-[#FFFFFF]"
                      >
                        {diff.name}
                      </h3>
                      <div
                        className={`text-xs font-bold mb-3 ${
                          isSelected ? 'text-[#D4D4D8]' : 'text-[#A1A1AA]'
                        }`}
                      >
                        {diff.subtitle}
                      </div>

                      {/* Description */}
                      <p
                        className={`text-xs leading-relaxed ${
                          isSelected ? 'text-[#E4E4E7]' : 'text-[#71717A]'
                        }`}
                      >
                        {diff.description}
                      </p>
                    </div>

                    {/* Bottom Status Tag */}
                    <div className={`mt-6 pt-3 border-t flex items-center justify-between text-xs font-bold ${
                      isSelected ? 'border-[#383838] text-white' : 'border-[#262626] text-[#71717A]'
                    }`}>
                      <span>{isSelected ? '✓ Selected' : 'Click to select level'}</span>
                      <Icons.ChevronRight size={14} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bottom Actions: Back and Continue Buttons */}
            <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToStep1}
                className="px-5 py-3 rounded-xl bg-[#1C1C1C] border border-[#303030] text-[#FFFFFF] hover:bg-[#292929] transition-all font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>← Back to Subject</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={!selectedDifficulty}
                className="px-6 py-3 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-sm transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Continue to Step 3</span>
                <Icons.ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: CHOOSE PRACTICE TEST (केवल टेस्ट लिस्ट स्क्रीन)        */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                {/* Context Breadcrumbs */}
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1C1C1C] border border-[#303030] text-[#A3A3A3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></span>
                    Step 3 of 3
                  </span>
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#303030] text-[#A3A3A3] hover:text-[#FFFFFF] cursor-pointer"
                  >
                    Subject: <strong className="text-[#FFFFFF]">{activeSubject.name}</strong> ✎
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToStep2}
                    className="text-xs px-2.5 py-0.5 rounded-full bg-[#1C1C1C] border border-[#303030] text-[#A3A3A3] hover:text-[#FFFFFF] cursor-pointer uppercase"
                  >
                    Level: <strong className="text-[#FFFFFF]">{selectedDifficulty}</strong> ✎
                  </button>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-[#FFFFFF] tracking-tight">
                  {activeSubject.name} — {selectedDifficulty ? selectedDifficulty.toUpperCase() : 'ALL'} Practice Tests
                </h1>
                <p className="text-sm text-[#A3A3A3]">
                  Select any drill to launch the distraction-free exam portal.
                </p>
              </div>

              {/* Quick Search Input */}
              <div className="relative min-w-[220px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#737373]">
                  <Icons.Search size={14} />
                </div>
                <input
                  type="text"
                  placeholder="Filter drills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-[#171717] border border-[#303030] text-[#FFFFFF] placeholder-[#737373] focus:outline-none focus:border-[#FFFFFF] font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[#737373] hover:text-[#FFFFFF] text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Test Count Badge */}
            <div className="flex items-center justify-between text-xs text-[#737373] pb-2 border-b border-[#2A2A2A]">
              <span>
                {loading ? (
                  <span className="inline-block w-32 h-3.5 bg-[#262626] rounded animate-pulse" />
                ) : (
                  <>
                    Showing <strong className="text-[#FFFFFF]">{finalFilteredAssessments.length}</strong> available practice drills
                  </>
                )}
              </span>
              <button
                type="button"
                onClick={handleBackToStep2}
                className="text-[#A3A3A3] hover:text-[#FFFFFF] underline font-semibold cursor-pointer"
              >
                Change Difficulty Level
              </button>
            </div>

            {/* Empty State vs 2-Column Test Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-[#1C1C1C] border border-[#303030] p-6 space-y-4" />
                ))}
              </div>
            ) : finalFilteredAssessments.length === 0 ? (
              <div className="p-12 text-center bg-[#1C1C1C] rounded-2xl border border-[#303030] space-y-4">
                <ExamForgeLogo variant="badge" size={24} className="w-12 h-12 rounded-2xl mx-auto border-[#303030]" />
                <h3 className="text-base font-bold text-[#FFFFFF]">
                  No Practice Tests Found
                </h3>
                <p className="text-xs text-[#A3A3A3] max-w-md mx-auto leading-relaxed">
                  No mock test matched <strong>{activeSubject.name}</strong> under the <strong>{selectedDifficulty?.toUpperCase()}</strong> difficulty level.
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBackToStep2}
                    className="px-4 py-2 rounded-xl bg-[#FFFFFF] text-[#111111] text-xs font-bold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    Select Another Difficulty
                  </button>
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="px-4 py-2 rounded-xl bg-[#222222] border border-[#303030] text-[#FFFFFF] text-xs font-bold hover:bg-[#292929] transition-colors cursor-pointer"
                  >
                    Change Subject
                  </button>
                </div>
              </div>
            ) : (
              /* Two-Column Grid on Desktop, Single-Column on Mobile */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {finalFilteredAssessments.map((test) => {
                  const diffKey = normalizeDiff(test.difficulty_level)

                  return (
                    <div
                      key={test.id}
                      className="rounded-2xl bg-[#1C1C1C] border border-[#303030] p-6 hover:bg-[#222222] hover:border-[#404040] transition-all flex flex-col justify-between group space-y-5"
                    >
                      <div className="space-y-3">
                        {/* Top Badges: Difficulty & Subject Code */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#222222] text-[#FFFFFF] border border-[#303030]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]"></span>
                            {diffKey === 'easy' ? 'Easy (सरल)' : diffKey === 'hard' ? 'Hard (कठिन)' : 'Medium (मध्यम)'}
                          </span>

                          <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#171717] text-[#A3A3A3] border border-[#303030]">
                            {test.subject_code || (test.subject_name ? test.subject_name.substring(0, 10) : 'MOCK')}
                          </span>
                        </div>

                        {/* Test Title */}
                        <h3 className="text-base sm:text-lg font-extrabold text-[#FFFFFF] leading-snug group-hover:text-[#FFFFFF]">
                          {test.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">
                          {test.description || 'Full syllabus practice test for Rajasthan Informatics Assistant.'}
                        </p>

                        {/* Subject Tag */}
                        {test.subject_name && (
                          <div className="text-[11px] font-semibold text-[#737373] flex items-center gap-1.5 pt-1">
                            <Icons.Subjects size={13} className="shrink-0 text-[#737373]" />
                            <span className="truncate">{test.subject_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Specifications & Action Button */}
                      <div className="pt-4 border-t border-[#2A2A2A] space-y-4">
                        {/* Test Statistics Card */}
                        <div className="grid grid-cols-4 gap-2 text-center text-xs bg-[#171717] rounded-xl p-2.5 border border-[#303030]">
                          <div>
                            <div className="font-mono font-black text-[#FFFFFF]">{test.total_questions}</div>
                            <div className="text-[9px] uppercase text-[#737373] font-semibold">Questions</div>
                          </div>
                          <div>
                            <div className="font-mono font-black text-[#FFFFFF]">{test.duration_minutes}m</div>
                            <div className="text-[9px] uppercase text-[#737373] font-semibold">Duration</div>
                          </div>
                          <div>
                            <div className="font-mono font-black text-[#FFFFFF]">{Number(test.total_marks || 0).toFixed(0)}</div>
                            <div className="text-[9px] uppercase text-[#737373] font-semibold">Marks</div>
                          </div>
                          <div>
                            <div className="font-mono font-black text-[#FFFFFF]">-0.25</div>
                            <div className="text-[9px] uppercase text-[#737373] font-semibold">Negative</div>
                          </div>
                        </div>

                        {/* Start Practice Test Button */}
                        <Link
                          href={`/practice/${test.id}`}
                          onClick={() => {
                            if (currentStudent && typeof window !== 'undefined') {
                              localStorage.setItem('examforge_current_student', JSON.stringify(currentStudent))
                            }
                          }}
                          className="w-full py-3 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                        >
                          <span>Start Practice Test</span>
                          <Icons.ChevronRight size={15} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Step 3 Navigation: Back to Step 2 */}
            <div className="pt-4 border-t border-[#2A2A2A] flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToStep2}
                className="px-5 py-3 rounded-xl bg-[#1C1C1C] border border-[#303030] text-[#FFFFFF] hover:bg-[#292929] transition-all font-bold text-sm flex items-center gap-2 cursor-pointer"
              >
                <span>← Back to Difficulty Level</span>
              </button>

              <button
                type="button"
                onClick={handleBackToStep1}
                className="px-4 py-2.5 rounded-xl text-xs text-[#A3A3A3] hover:text-[#FFFFFF] transition-colors cursor-pointer"
              >
                Choose Different Subject
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Saved Bookmarks Manager Modal */}
      {currentStudent && (
        <BookmarkModal
          isOpen={showBookmarksModal}
          onClose={() => setShowBookmarksModal(false)}
          studentId={currentStudent.id}
          onBookmarkRemoved={() => setBookmarkCount((c) => Math.max(0, c - 1))}
        />
      )}

      {/* Student Completed Results Modal */}
      {currentStudent && (
        <StudentResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          studentId={currentStudent.id}
          studentName={currentStudent.full_name}
        />
      )}
    </div>
  )
}

export default function StudentPracticePortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#101010] text-[#FFFFFF] flex items-center justify-center p-6">
          <div className="w-8 h-8 border-2 border-[#FFFFFF] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PracticePortalContent />
    </Suspense>
  )
}
