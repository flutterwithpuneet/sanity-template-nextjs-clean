'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/admin/Icons'
import { TestCatalogSkeleton } from '@/app/components/Shimmer'

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

export default function StudentPracticePortalPage() {
  const [assessments, setAssessments] = useState<AssessmentItem[]>([])
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [currentStudent, setCurrentStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Step 1: Selected Subject (default to first subject or '1')
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('1')

  // Step 2: Selected Difficulty Level ('easy' | 'medium' | 'hard') - mandatory selection
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('easy')

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')

  // Candidate quick login modal / name switch
  const [newStudentName, setNewStudentName] = useState('')
  const [showSwitchModal, setShowSwitchModal] = useState(false)

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
        // If current selectedSubjectId not in subjects and not full_mock, set to first subject
        const hasSub = resSubs.subjects.some((s: any) => String(s.id) === selectedSubjectId)
        if (!hasSub && selectedSubjectId !== 'full_mock' && selectedSubjectId !== 'all') {
          setSelectedSubjectId(String(resSubs.subjects[0].id))
        }
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
  const normalizeDiff = (d?: string) => {
    const val = (d || 'medium').toLowerCase()
    if (val === 'low' || val === 'easy') return 'easy'
    if (val === 'high' || val === 'hard') return 'hard'
    return 'medium'
  }

  // Filter assessments strictly by selected subject AND selected difficulty
  const filteredAssessments = useMemo(() => {
    return assessments.filter((test) => {
      // 1. Subject match
      if (selectedSubjectId === 'full_mock') {
        if (test.subject_id !== null) return false
      } else if (selectedSubjectId !== 'all') {
        if (String(test.subject_id) !== String(selectedSubjectId)) return false
      }

      // 2. Difficulty match
      if (selectedDifficulty && selectedDifficulty !== 'all') {
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

  // Count tests in the currently chosen subject for each difficulty level
  const subjectDifficultyCounts = useMemo(() => {
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

  // Active subject name
  const activeSubjectName = useMemo(() => {
    if (selectedSubjectId === 'all') return 'All Subjects'
    if (selectedSubjectId === 'full_mock') return 'Full-Length Mocks'
    const found = subjects.find((s) => String(s.id) === selectedSubjectId)
    return found?.name || 'Selected Subject'
  }, [subjects, selectedSubjectId])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Top Header - Solid Black Monochrome */}
      <header className="sticky top-0 z-40 bg-black text-white border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              EF
            </div>
            <div>
              <span className="font-black text-base tracking-tight text-white block leading-tight">
                ExamForge Practice Portal
              </span>
              <span className="text-[10px] text-neutral-400 font-medium">
                Rajasthan Informatics Assistant Online Test Series
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {/* Candidate Status Badge */}
            {currentStudent && (
              <div className="flex items-center gap-2.5 bg-neutral-900 border border-neutral-700 px-3 py-1.5 rounded-xl text-xs">
                <div className="w-6 h-6 rounded-full bg-white text-black font-bold flex items-center justify-center text-[10px]">
                  {currentStudent.full_name?.charAt(0) || 'C'}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="font-bold text-white text-xs leading-tight">
                    {currentStudent.full_name}
                  </div>
                  <div className="text-[9px] text-neutral-400 font-mono">
                    Candidate #{currentStudent.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSwitchModal(true)}
                  className="text-[10px] text-neutral-300 underline hover:text-white ml-1 font-semibold cursor-pointer"
                >
                  Change
                </button>
              </div>
            )}

            <Link
              href="/admin"
              className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors shadow-xs"
            >
              Admin Panel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Welcome Banner - Monochrome Black & White */}
        <div className="rounded-3xl bg-white border border-gray-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold bg-neutral-100 text-black border border-gray-300 uppercase">
              <span className="w-2 h-2 rounded-full bg-black"></span>
              Subject-Wise & Difficulty-Graded Mock Series
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-black tracking-tight">
              Welcome, {currentStudent?.full_name || 'Candidate'}
            </h1>
            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              पहले अपना <strong>Subject (विषय)</strong> चुनें, फिर उसके बाद <strong>Easy, Medium या Hard</strong> स्तर चुनना अनिवार्य है। चुने गए विषय और स्तर के अनुसार ही मॉक टेस्ट खुलेंगे।
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center min-w-[110px] text-white">
              <div className="text-2xl font-black font-mono text-white">{assessments.length}</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase mt-0.5">Total Tests</div>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-center min-w-[110px] text-white">
              <div className="text-2xl font-black font-mono text-white">0.25</div>
              <div className="text-[10px] font-bold text-neutral-400 uppercase mt-0.5">Negative Mark</div>
            </div>
          </div>
        </div>

        {/* STEP 1: CHOOSE SUBJECT (विषय चुनें) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-black text-white font-black text-xs flex items-center justify-center shadow-xs">
                1
              </span>
              <div>
                <h2 className="text-base font-extrabold text-black tracking-tight flex items-center gap-2">
                  <span>Step 1: Choose Subject (पहले विषय चुनें)</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black text-white">
                    Mandatory
                  </span>
                </h2>
                <p className="text-[11px] text-gray-500">
                  Select the subject you want to practice
                </p>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-gray-500">
              {subjects.length} Subjects Available
            </span>
          </div>

          {/* Subject Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* All Subjects Option */}
            <button
              type="button"
              onClick={() => setSelectedSubjectId('all')}
              className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                selectedSubjectId === 'all'
                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/20'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                  selectedSubjectId === 'all' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  ALL
                </span>
                <span className={`text-[10px] font-bold font-mono ${
                  selectedSubjectId === 'all' ? 'text-neutral-300' : 'text-gray-500'
                }`}>
                  {assessments.length} Tests
                </span>
              </div>
              <span className="text-xs font-bold leading-snug line-clamp-2">
                All Subjects (सम्पूर्ण)
              </span>
            </button>

            {/* Each Subject Button */}
            {subjects.map((sub) => {
              const isSelected = selectedSubjectId === String(sub.id)
              const count = Number(sub.tests_count || 0)
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(String(sub.id))}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-md ring-2 ring-black/20'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {sub.code || 'SUB'}
                    </span>
                    <span className={`text-[10px] font-bold font-mono ${
                      isSelected ? 'text-neutral-300' : 'text-gray-500'
                    }`}>
                      {count} Tests
                    </span>
                  </div>
                  <span className="text-xs font-bold leading-snug line-clamp-2" title={sub.name}>
                    {sub.name}
                  </span>
                </button>
              )
            })}

            {/* Full-Length Mocks Option */}
            <button
              type="button"
              onClick={() => setSelectedSubjectId('full_mock')}
              className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer ${
                selectedSubjectId === 'full_mock'
                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/20'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                  selectedSubjectId === 'full_mock' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  FULL
                </span>
                <span className={`text-[10px] font-bold font-mono ${
                  selectedSubjectId === 'full_mock' ? 'text-neutral-300' : 'text-gray-500'
                }`}>
                  {assessments.filter((t) => t.subject_id === null).length} Tests
                </span>
              </div>
              <span className="text-xs font-bold leading-snug line-clamp-2">
                Full-Length Mocks
              </span>
            </button>
          </div>
        </div>

        {/* STEP 2: CHOOSE DIFFICULTY LEVEL (कठिनाई स्तर चुनना अनिवार्य है) */}
        <div className="rounded-3xl bg-white border border-gray-200 p-5 md:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-black text-white font-black text-xs flex items-center justify-center shadow-xs">
                2
              </span>
              <div>
                <h3 className="text-base font-extrabold text-black flex items-center gap-2">
                  <span>Step 2: Choose Difficulty Category (स्तर चुनना अनिवार्य है)</span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-black text-white">
                    Required
                  </span>
                </h3>
                <p className="text-[11px] text-gray-500">
                  Select Easy (सरल), Medium (मध्यम), or Hard (कठिन) level for {activeSubjectName}
                </p>
              </div>
            </div>

            {/* Quick Keyword Search */}
            <div className="relative min-w-[220px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Icons.Search size={14} />
              </div>
              <input
                type="text"
                placeholder="Search mock test..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-300 focus:outline-none focus:border-black font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-black text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* 3 Large Mandatory Difficulty Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* EASY LEVEL */}
            <button
              type="button"
              onClick={() => setSelectedDifficulty('easy')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedDifficulty === 'easy'
                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/20'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedDifficulty === 'easy' ? 'bg-white' : 'bg-black'}`}></span>
                  <span className="text-sm font-black tracking-tight">Easy Level (सरल)</span>
                </div>
                <div className={`text-[11px] ${selectedDifficulty === 'easy' ? 'text-neutral-300' : 'text-gray-500'}`}>
                  Basic concept questions
                </div>
              </div>
              <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl ${
                selectedDifficulty === 'easy' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'
              }`}>
                {subjectDifficultyCounts.easy} Tests
              </span>
            </button>

            {/* MEDIUM LEVEL */}
            <button
              type="button"
              onClick={() => setSelectedDifficulty('medium')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedDifficulty === 'medium'
                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/20'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedDifficulty === 'medium' ? 'bg-white' : 'bg-black'}`}></span>
                  <span className="text-sm font-black tracking-tight">Medium Level (मध्यम)</span>
                </div>
                <div className={`text-[11px] ${selectedDifficulty === 'medium' ? 'text-neutral-300' : 'text-gray-500'}`}>
                  Standard exam questions
                </div>
              </div>
              <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl ${
                selectedDifficulty === 'medium' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'
              }`}>
                {subjectDifficultyCounts.medium} Tests
              </span>
            </button>

            {/* HARD LEVEL */}
            <button
              type="button"
              onClick={() => setSelectedDifficulty('hard')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                selectedDifficulty === 'hard'
                  ? 'bg-black text-white border-black shadow-md ring-2 ring-black/20'
                  : 'bg-white text-gray-800 border-gray-200 hover:border-black hover:bg-gray-50'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${selectedDifficulty === 'hard' ? 'bg-white' : 'bg-black'}`}></span>
                  <span className="text-sm font-black tracking-tight">Hard Level (कठिन)</span>
                </div>
                <div className={`text-[11px] ${selectedDifficulty === 'hard' ? 'text-neutral-300' : 'text-gray-500'}`}>
                  Advanced analytical questions
                </div>
              </div>
              <span className={`font-mono text-xs font-black px-2.5 py-1 rounded-xl ${
                selectedDifficulty === 'hard' ? 'bg-neutral-800 text-white' : 'bg-gray-100 text-black'
              }`}>
                {subjectDifficultyCounts.hard} Tests
              </span>
            </button>
          </div>

          {/* Optional Quick Link to show all levels for this subject */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-gray-500 font-medium">
              Active Category: <strong className="text-black uppercase">{selectedDifficulty}</strong> in <strong>{activeSubjectName}</strong>
            </span>

            {selectedDifficulty !== 'all' ? (
              <button
                type="button"
                onClick={() => setSelectedDifficulty('all')}
                className="text-gray-700 hover:text-black font-semibold underline cursor-pointer"
              >
                Show All Difficulty Levels ({subjectDifficultyCounts.all})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedDifficulty('easy')}
                className="text-gray-700 hover:text-black font-semibold underline cursor-pointer"
              >
                Switch back to Easy / Medium / Hard filter
              </button>
            )}
          </div>
        </div>

        {/* STEP 3: MOCK TESTS LIST (दिखाए गए मॉक टेस्ट) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-black text-black tracking-tight">
                {activeSubjectName} — {selectedDifficulty.toUpperCase()} Level Mocks
              </h2>
              <p className="text-xs text-gray-500">
                Live countdown test interface with negative marking and per-question timing
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-black text-white shadow-xs">
                {filteredAssessments.length} Tests Ready
              </span>
            </div>
          </div>

          {loading ? (
            <TestCatalogSkeleton />
          ) : filteredAssessments.length === 0 ? (
            <div className="p-12 text-center text-gray-600 bg-white rounded-3xl border border-gray-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-black mx-auto flex items-center justify-center font-bold">
                EF
              </div>
              <h3 className="text-base font-bold text-black">No Mock Tests Available For This Level</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                No mock test matched <strong>{activeSubjectName}</strong> with <strong>{selectedDifficulty.toUpperCase()}</strong> difficulty.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('easy')}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 text-black text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  Try Easy Level
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('medium')}
                  className="px-3.5 py-2 rounded-xl bg-gray-100 text-black text-xs font-bold hover:bg-gray-200 cursor-pointer"
                >
                  Try Medium Level
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDifficulty('all')}
                  className="px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 cursor-pointer"
                >
                  View All Levels
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssessments.map((test) => {
                const diffKey = normalizeDiff(test.difficulty_level)
                return (
                  <div
                    key={test.id}
                    className="rounded-3xl bg-white border border-gray-200 p-6 shadow-xs hover:border-black hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Top Badges: Difficulty & Subject */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-black text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                          {diffKey === 'easy' ? 'Easy (सरल)' : diffKey === 'hard' ? 'Hard (कठिन)' : 'Medium (मध्यम)'}
                        </span>

                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-gray-100 text-black border border-gray-200">
                          {test.subject_code || (test.subject_name ? test.subject_name.substring(0, 10) : 'MOCK')}
                        </span>
                      </div>

                      {/* Test Title */}
                      <h3 className="text-base font-extrabold text-black leading-snug group-hover:text-black">
                        {test.title}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {test.description || 'Full syllabus practice test for Rajasthan Informatics Assistant.'}
                      </p>

                      {/* Subject Name Tag */}
                      {test.subject_name && (
                        <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1.5 pt-1">
                          <Icons.Subjects size={13} className="shrink-0 text-gray-400" />
                          <span className="truncate">{test.subject_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Specifications & Start Button */}
                    <div className="mt-6 pt-4 border-t border-gray-100 space-y-4">
                      <div className="grid grid-cols-3 gap-2 text-center text-xs bg-gray-50 rounded-2xl p-2.5 border border-gray-100">
                        <div>
                          <div className="font-mono font-black text-black">{test.total_questions}</div>
                          <div className="text-[9px] uppercase text-gray-500 font-semibold">Questions</div>
                        </div>
                        <div>
                          <div className="font-mono font-black text-black">{test.duration_minutes}m</div>
                          <div className="text-[9px] uppercase text-gray-500 font-semibold">Time</div>
                        </div>
                        <div>
                          <div className="font-mono font-black text-black">{Number(test.total_marks || 0).toFixed(0)}</div>
                          <div className="text-[9px] uppercase text-gray-500 font-semibold">Marks</div>
                        </div>
                      </div>

                      <Link
                        href={`/practice/${test.id}`}
                        onClick={() => {
                          if (currentStudent && typeof window !== 'undefined') {
                            localStorage.setItem('examforge_current_student', JSON.stringify(currentStudent))
                          }
                        }}
                        className="w-full py-2.5 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <span>Start Practice Test</span>
                        <Icons.ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Switch Candidate Profile Modal - Monochrome */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-200">
              <h3 className="text-base font-bold text-black">Select Candidate Profile</h3>
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-black cursor-pointer"
              >
                <Icons.Close size={18} />
              </button>
            </div>

            {/* Existing candidates list */}
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
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
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  <span>{st.full_name}</span>
                  <span className="font-mono text-[10px] opacity-75">{st.email}</span>
                </button>
              ))}
            </div>

            {/* Create new candidate */}
            <form onSubmit={handleRegisterOrSelect} className="pt-3 border-t border-gray-200 space-y-3">
              <span className="text-[10px] font-bold text-gray-500 uppercase block">
                Or Enter Your Name:
              </span>
              <input
                type="text"
                required
                value={newStudentName}
                onChange={(e) => setNewStudentName(e.target.value)}
                placeholder="Enter candidate full name..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-black font-medium"
              />
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
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
