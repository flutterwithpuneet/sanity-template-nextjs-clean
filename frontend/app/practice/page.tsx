'use client'

import React, { useEffect, useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Icons } from '@/components/admin/Icons'

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

  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [currentStudent, setCurrentStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 3-Step Guided Flow State (1: Subject, 2: Difficulty, 3: Practice Test)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Step 1: Selected Subject
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all')

  // Step 2: Selected Difficulty Level
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null)

  // Step 3: Search filter for tests
  const [searchQuery, setSearchQuery] = useState('')

  // Candidate quick switcher modal
  const [newStudentName, setNewStudentName] = useState('')
  const [showSwitchModal, setShowSwitchModal] = useState(false)

  // Initialize from URL query params if present
  useEffect(() => {
    const stepParam = searchParams.get('step')
    const subParam = searchParams.get('subject')
    const diffParam = searchParams.get('diff')

    if (subParam && CORE_SUBJECT_OPTIONS.some((s) => s.id === subParam)) {
      setSelectedSubjectId(subParam)
    }
    if (diffParam && (diffParam === 'easy' || diffParam === 'medium' || diffParam === 'hard')) {
      setSelectedDifficulty(diffParam as 'easy' | 'medium' | 'hard')
    }
    if (stepParam === '2') {
      setCurrentStep(2)
    } else if (stepParam === '3') {
      setCurrentStep(3)
    }
  }, [searchParams])

  // Fetch assessments, subjects, and student profile
  const loadData = async () => {
    try {
      setLoading(true)
      const [resTests, resSubs, resStudents] = await Promise.all([
        fetch('/api/student/assessments').then((r) => r.json()),
        fetch('/api/student/subjects').then((r) => r.json()),
        fetch('/api/student/profile').then((r) => r.json()),
      ])

      if (resTests.success) setAssessments(resTests.assessments || [])
      if (resSubs.success && resSubs.subjects?.length > 0) {
        setSubjects(resSubs.subjects)
      }

      if (resStudents.success && resStudents.students?.length > 0) {
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

  // Handle Candidate Switching or New Registration
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

  const handleJumpToStep = (stepNumber: 1 | 2 | 3) => {
    if (stepNumber === 1) {
      handleBackToStep1()
    } else if (stepNumber === 2 && selectedSubjectId) {
      setCurrentStep(2)
      updateUrlParams(2, selectedSubjectId, selectedDifficulty)
    } else if (stepNumber === 3 && selectedSubjectId && selectedDifficulty) {
      setCurrentStep(3)
      updateUrlParams(3, selectedSubjectId, selectedDifficulty)
    }
  }

  return (
    <div className="min-h-screen bg-[#101010] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#222222] selection:text-[#FFFFFF]">
      {/* 1. Header — Soft Monochrome Dark */}
      <header className="sticky top-0 z-40 bg-[#101010] border-b border-[#303030]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Subtitle */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#FFFFFF] text-[#111111] font-black text-sm flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              EF
            </div>
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
          <div className="flex items-center gap-3 sm:gap-4">
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
                    Candidate #{currentStudent.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(true)}
                  className="text-[10px] text-[#A3A3A3] underline hover:text-[#FFFFFF] ml-1 font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] text-[#111111] text-xs font-bold hover:bg-[#E5E5E5] transition-colors shadow-sm"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Practice Layout */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Top Statistics Bar — Compact Dark Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-[#1C1C1C] border border-[#303030] text-left">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#737373] block mb-1">
              Total Drills
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#FFFFFF]">
              {assessments.length} Tests
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
            <div className="text-sm sm:text-base font-bold text-[#FFFFFF] truncate">
              {activeSubject.code}
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

        {/* 3. Three-Step Progress Indicator */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#171717] border border-[#303030]">
          <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
            {/* Step 1 Pill */}
            <button
              type="button"
              onClick={() => handleJumpToStep(1)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentStep === 1
                  ? 'bg-[#FFFFFF] text-[#111111] font-bold shadow-sm'
                  : currentStep > 1
                  ? 'text-[#FFFFFF] hover:text-[#FFFFFF]'
                  : 'text-[#737373]'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                  currentStep === 1
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : currentStep > 1
                    ? 'bg-[#303030] text-[#FFFFFF]'
                    : 'bg-[#222222] text-[#737373]'
                }`}
              >
                {currentStep > 1 ? '✓' : '1'}
              </span>
              <span>Step 1 — Subject</span>
            </button>

            <span className="text-[#303030] font-bold">→</span>

            {/* Step 2 Pill */}
            <button
              type="button"
              onClick={() => handleJumpToStep(2)}
              disabled={!selectedSubjectId}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                currentStep === 2
                  ? 'bg-[#FFFFFF] text-[#111111] font-bold shadow-sm cursor-pointer'
                  : currentStep > 2
                  ? 'text-[#FFFFFF] hover:text-[#FFFFFF] cursor-pointer'
                  : 'text-[#737373] cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                  currentStep === 2
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : currentStep > 2
                    ? 'bg-[#303030] text-[#FFFFFF]'
                    : 'bg-[#222222] text-[#737373]'
                }`}
              >
                {currentStep > 2 ? '✓' : '2'}
              </span>
              <span>Step 2 — Difficulty</span>
            </button>

            <span className="text-[#303030] font-bold">→</span>

            {/* Step 3 Pill */}
            <button
              type="button"
              onClick={() => handleJumpToStep(3)}
              disabled={!selectedDifficulty}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                currentStep === 3
                  ? 'bg-[#FFFFFF] text-[#111111] font-bold shadow-sm cursor-pointer'
                  : 'text-[#737373] cursor-not-allowed'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-black ${
                  currentStep === 3
                    ? 'bg-[#111111] text-[#FFFFFF]'
                    : 'bg-[#222222] text-[#737373]'
                }`}
              >
                3
              </span>
              <span>Step 3 — Practice Test</span>
            </button>
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
                        ? 'bg-[#FFFFFF] text-[#111111] border-[#FFFFFF] shadow-lg ring-2 ring-white/20'
                        : 'bg-[#1C1C1C] text-[#FFFFFF] border-[#303030] hover:bg-[#292929] hover:border-[#404040]'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Abbrev badge & Available test count */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#111111] text-[#FFFFFF]'
                              : 'bg-[#222222] text-[#A3A3A3] border border-[#303030]'
                          }`}
                        >
                          {sub.code}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold ${
                            isSelected ? 'text-[#111111]' : 'text-[#737373]'
                          }`}
                        >
                          {testCount} Tests Available
                        </span>
                      </div>

                      {/* Subject Name & Hindi Name */}
                      <h3
                        className={`text-base font-extrabold leading-tight mb-1 ${
                          isSelected ? 'text-[#111111]' : 'text-[#FFFFFF]'
                        }`}
                      >
                        {sub.name}
                      </h3>
                      <p
                        className={`text-xs font-medium mb-3 ${
                          isSelected ? 'text-[#333333]' : 'text-[#737373]'
                        }`}
                      >
                        {sub.hindiName}
                      </p>

                      {/* Description */}
                      <p
                        className={`text-xs leading-relaxed ${
                          isSelected ? 'text-[#444444]' : 'text-[#A3A3A3]'
                        }`}
                      >
                        {sub.description}
                      </p>
                    </div>

                    {/* Bottom Selected Indicator */}
                    <div className="mt-4 pt-3 border-t border-current/10 flex items-center justify-between text-xs font-bold">
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
                className="px-6 py-3 rounded-xl bg-[#FFFFFF] text-[#111111] font-bold text-sm hover:bg-[#E5E5E5] transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                        ? 'bg-[#FFFFFF] text-[#111111] border-[#FFFFFF] shadow-lg ring-2 ring-white/20'
                        : 'bg-[#1C1C1C] text-[#FFFFFF] border-[#303030] hover:bg-[#292929] hover:border-[#404040]'
                    }`}
                  >
                    <div>
                      {/* Top Header: Radio / Badge & Count */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                              isSelected ? 'border-[#111111]' : 'border-[#737373]'
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#111111]"></span>}
                          </span>
                          <span
                            className={`text-xs font-mono uppercase font-bold tracking-wider ${
                              isSelected ? 'text-[#111111]' : 'text-[#A3A3A3]'
                            }`}
                          >
                            {diff.id}
                          </span>
                        </div>

                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-[#111111] text-[#FFFFFF]'
                              : 'bg-[#222222] text-[#A3A3A3] border border-[#303030]'
                          }`}
                        >
                          {testCount} Tests
                        </span>
                      </div>

                      {/* Difficulty Title */}
                      <h3
                        className={`text-xl font-black mb-1 ${
                          isSelected ? 'text-[#111111]' : 'text-[#FFFFFF]'
                        }`}
                      >
                        {diff.name}
                      </h3>
                      <div
                        className={`text-xs font-bold mb-3 ${
                          isSelected ? 'text-[#333333]' : 'text-[#A3A3A3]'
                        }`}
                      >
                        {diff.subtitle}
                      </div>

                      {/* Description */}
                      <p
                        className={`text-xs leading-relaxed ${
                          isSelected ? 'text-[#444444]' : 'text-[#737373]'
                        }`}
                      >
                        {diff.description}
                      </p>
                    </div>

                    {/* Bottom Status Tag */}
                    <div className="mt-6 pt-3 border-t border-current/10 flex items-center justify-between text-xs font-bold">
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
                className="px-6 py-3 rounded-xl bg-[#FFFFFF] text-[#111111] font-bold text-sm hover:bg-[#E5E5E5] transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                Showing <strong className="text-[#FFFFFF]">{finalFilteredAssessments.length}</strong> available practice drills
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
                <div className="w-12 h-12 rounded-2xl bg-[#222222] border border-[#303030] text-[#FFFFFF] mx-auto flex items-center justify-center font-bold">
                  EF
                </div>
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
                          className="w-full py-3 rounded-xl bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#111111] font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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

      {/* 4. Switch Candidate Modal — Soft Monochrome Dark */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#303030] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#303030]">
              <h3 className="text-base font-bold text-[#FFFFFF]">Select Candidate Profile</h3>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="p-1 rounded-lg text-[#737373] hover:text-[#FFFFFF] cursor-pointer"
              >
                <Icons.Close size={18} />
              </button>
            </div>

            {/* Existing Candidates List */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              <span className="text-[10px] font-bold text-[#737373] uppercase block mb-1">
                Choose Existing Candidate:
              </span>
              {students.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setCurrentStudent(st)
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('examforge_current_student', JSON.stringify(st))
                    }
                    setShowSwitchModal(false)
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs text-left font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    currentStudent?.id === st.id
                      ? 'bg-[#FFFFFF] text-[#111111]'
                      : 'bg-[#171717] text-[#FFFFFF] hover:bg-[#222222] border border-[#303030]'
                  }`}
                >
                  <span>{st.full_name}</span>
                  <span className="font-mono text-[10px] opacity-75">{st.email}</span>
                </button>
              ))}
            </div>

            {/* Create New Candidate Form */}
            <form onSubmit={handleRegisterOrSelect} className="pt-3 border-t border-[#303030] space-y-3">
              <span className="text-[10px] font-bold text-[#737373] uppercase block">
                Or Register Candidate Name:
              </span>
              <input
                type="text"
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Enter full name..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#171717] border border-[#303030] text-[#FFFFFF] placeholder-[#737373] text-xs focus:outline-none focus:border-[#FFFFFF] font-medium"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#FFFFFF] text-[#111111] text-xs font-bold hover:bg-[#E5E5E5] transition-colors cursor-pointer"
              >
                Set as Active Candidate
              </button>
            </form>
          </div>
        </div>
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
