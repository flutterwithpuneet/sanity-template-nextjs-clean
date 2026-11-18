'use client'

import React, { useEffect, useState, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/admin/Icons'
import { ExamPortalSkeleton } from '@/app/components/Shimmer'
import { ExamForgeLogo } from '@/components/brand'
import BookmarkModal from '@/components/student/BookmarkModal'

interface Option {
  id: number
  key: string
  text: string
  text_hi?: string
}

interface Question {
  assessment_question_id: number
  question_id: number
  order_index: number
  marks: string | number
  negative_marks: string | number
  question_text: string
  question_text_hi?: string
  question_type: string
  difficulty: string
  language_code: string
  subject_name: string
  topic_name: string
  options: Option[]
}

interface StudentSession {
  id: number
  full_name: string
  username?: string
  email?: string
}

export default function ExamLiveInterface({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  // State: 'loading' | 'auth_required' | 'instructions' | 'live'
  const [examPhase, setExamPhase] = useState<'loading' | 'auth_required' | 'instructions' | 'live'>('loading')
  const [student, setStudent] = useState<StudentSession | null>(null)
  const [availableStudents, setAvailableStudents] = useState<any[]>([])

  const [assessment, setAssessment] = useState<any>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [attemptId, setAttemptId] = useState<number | null>(null)

  // Instruction agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [startingAttempt, setStartingAttempt] = useState(false)

  // Current active question index (0-based)
  const [currentIndex, setCurrentIndex] = useState(0)

  // Student Responses State: question_id -> option_key ('A', 'B', 'C', 'D' or null)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string | null>>({})

  // Question Status State: 'answered' | 'marked_for_review' | 'visited_unanswered' | 'not_visited'
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, string>>({})

  // Per-Question Time Tracking State
  const [perQuestionSeconds, setPerQuestionSeconds] = useState<Record<number, number>>({})
  const questionStartTimeRef = useRef<number>(Date.now())

  // Overall test countdown timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(1200)
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState<number>(0)
  const [currentQSeconds, setCurrentQSeconds] = useState<number>(0)

  // Modals
  const [showExitModal, setShowExitModal] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Quick candidate name for login fallback
  const [quickName, setQuickName] = useState('')

  // Fullscreen & Question Palette Expand/Collapse State
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(true)

  // Language Mode: 'both' (Bilingual) | 'hi' (Hindi) | 'en' (English)
  const [langMode, setLangMode] = useState<'both' | 'hi' | 'en'>('both')

  // Question Bookmark State
  const [bookmarkedQIds, setBookmarkedQIds] = useState<Set<number>>(new Set())
  const [showBookmarksModal, setShowBookmarksModal] = useState(false)
  const [paletteFilter, setPaletteFilter] = useState<'all' | 'bookmarked'>('all')

  // Listen to fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err))
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.error(err))
      }
    }
  }

  // 1. Initial Load: Strip URL params and verify Student Session
  useEffect(() => {
    // Strip query parameters to ensure clean URL
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    const checkSessionAndFetch = async () => {
      try {
        setExamPhase('loading')

        // 1. Verify Student Authentication Session
        const resProfile = await fetch('/api/student/profile').then((r) => r.json())
        if (!resProfile.success || !resProfile.student) {
          router.push(`/login?redirect=/practice/${id}`)
          return
        }

        const activeStudent = resProfile.student
        setStudent(activeStudent)

        // 2. Fetch Assessment Details (enforces server assignment check)
        const resTest = await fetch(`/api/student/assessments/${id}`)
        const jsonTest = await resTest.json()

        if (!jsonTest.success) {
          alert(jsonTest.error || 'Access to this mock test is not authorized.')
          router.push('/practice')
          return
        }

        setAssessment(jsonTest.assessment)
        setQuestions(jsonTest.questions)
        const durationSec = (jsonTest.assessment.duration_minutes || 20) * 60
        setRemainingSeconds(durationSec)
        setExamPhase('instructions')

        // Prefetch existing bookmarks for student
        fetch(`/api/student/bookmarks?student_id=${activeStudent.id}`)
          .then((r) => r.json())
          .then((bData) => {
            if (bData.success && bData.question_ids) {
              setBookmarkedQIds(new Set(bData.question_ids))
            }
          })
          .catch(() => {})

        // Initialize question statuses
        const initialStatus: Record<number, string> = {}
        const initialTimes: Record<number, number> = {}
        jsonTest.questions.forEach((q: Question, idx: number) => {
          initialStatus[q.question_id] = idx === 0 ? 'visited_unanswered' : 'not_visited'
          initialTimes[q.question_id] = 0
        })
        setQuestionStatuses(initialStatus)
        setPerQuestionSeconds(initialTimes)
      } catch (err) {
        console.error('Failed to initialize:', err)
        router.push('/practice')
      }
    }

    checkSessionAndFetch()
  }, [id, router])

  // 2. Start Official Exam Attempt (Only on user clicking "Start Assessment")
  const handleStartExam = async () => {
    if (!agreedToTerms) {
      alert('कृपया परीक्षा नियम स्वीकारने के लिए चेकबॉक्स पर टिक करें।')
      return
    }

    if (!student || !student.id) {
      setExamPhase('auth_required')
      return
    }

    try {
      setStartingAttempt(true)
      const resAttempt = await fetch('/api/student/attempts/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessment_id: Number(id),
          student_id: student.id,
        }),
      })

      const jsonAttempt = await resAttempt.json()
      if (jsonAttempt.success) {
        setAttemptId(jsonAttempt.attemptId)
        questionStartTimeRef.current = Date.now()
        setExamPhase('live')
      } else {
        alert(jsonAttempt.error || 'Failed to start official attempt.')
      }
    } catch (err) {
      console.error('Error starting attempt:', err)
      alert('Network error while starting attempt.')
    } finally {
      setStartingAttempt(false)
    }
  }

  // 3. Quick Login / Select Candidate
  const handleSelectStudent = (st: StudentSession) => {
    setStudent(st)
    localStorage.setItem('examforge_current_student', JSON.stringify(st))
    setExamPhase('instructions')
  }

  const handleCreateQuickStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickName.trim()) return

    try {
      const res = await fetch('/api/student/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: quickName.trim() }),
      })
      const json = await res.json()
      if (json.success && json.student) {
        handleSelectStudent(json.student)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // 4. Timer Ticker (Only runs when examPhase === 'live')
  useEffect(() => {
    if (examPhase !== 'live' || !assessment) return

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleFinalSubmit(true) // Auto-submit on time expiry
          return 0
        }
        return prev - 1
      })

      setTotalElapsedSeconds((prev) => prev + 1)
      setCurrentQSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [examPhase, assessment])

  // 5. Browser Navigation Protection (Prevent accidental exit / reload)
  useEffect(() => {
    if (examPhase !== 'live') return

    // Prevent tab close or refresh
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!submitting) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Intercept browser back button
    window.history.pushState(null, '', window.location.pathname)
    const handlePopState = () => {
      window.history.pushState(null, '', window.location.pathname)
      setShowExitModal(true)
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [examPhase, submitting])

  // Time tracking helper for active question
  const recordCurrentQuestionTime = () => {
    const q = questions[currentIndex]
    if (!q) return

    const elapsed = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000))
    setPerQuestionSeconds((prev) => ({
      ...prev,
      [q.question_id]: (prev[q.question_id] || 0) + elapsed,
    }))
    questionStartTimeRef.current = Date.now()
    setCurrentQSeconds(0)
  }

  // Question navigation
  const goToQuestion = (targetIndex: number) => {
    if (targetIndex < 0 || targetIndex >= questions.length) return
    recordCurrentQuestionTime()
    setCurrentIndex(targetIndex)

    const targetQ = questions[targetIndex]
    if (targetQ) {
      const curStatus = questionStatuses[targetQ.question_id]
      if (curStatus === 'not_visited' || !curStatus) {
        setQuestionStatuses((prev) => ({
          ...prev,
          [targetQ.question_id]: 'visited_unanswered',
        }))
      }
    }
  }

  // Option selection
  const handleSelectOption = (key: string) => {
    const q = questions[currentIndex]
    if (!q) return

    setSelectedAnswers((prev) => ({
      ...prev,
      [q.question_id]: key,
    }))

    if (questionStatuses[q.question_id] !== 'marked_for_review') {
      setQuestionStatuses((prev) => ({
        ...prev,
        [q.question_id]: 'answered',
      }))
    }
  }

  // Clear response
  const handleClearResponse = () => {
    const q = questions[currentIndex]
    if (!q) return

    setSelectedAnswers((prev) => ({
      ...prev,
      [q.question_id]: null,
    }))

    setQuestionStatuses((prev) => ({
      ...prev,
      [q.question_id]: 'visited_unanswered',
    }))
  }

  // Save & Next
  const handleSaveAndNext = () => {
    const q = questions[currentIndex]
    if (!q) return

    const chosen = selectedAnswers[q.question_id]
    setQuestionStatuses((prev) => ({
      ...prev,
      [q.question_id]: chosen ? 'answered' : 'visited_unanswered',
    }))

    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  // Mark for Review & Next
  const handleMarkForReviewAndNext = () => {
    const q = questions[currentIndex]
    if (!q) return

    setQuestionStatuses((prev) => ({
      ...prev,
      [q.question_id]: 'marked_for_review',
    }))

    if (currentIndex < questions.length - 1) {
      goToQuestion(currentIndex + 1)
    }
  }

  // Toggle Bookmark for current question
  const handleToggleBookmark = async () => {
    const q = questions[currentIndex]
    if (!q || !student) return
    const qId = q.question_id
    const wasBookmarked = bookmarkedQIds.has(qId)

    // Optimistic toggle
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
          student_id: student.id,
          question_id: qId,
          action: wasBookmarked ? 'remove' : 'add',
        }),
      })
    } catch (err) {
      console.error('Failed to toggle bookmark:', err)
    }
  }

  // Final Submit
  const handleFinalSubmit = async (isAuto = false) => {
    if (submitting) return
    setSubmitting(true)

    recordCurrentQuestionTime()

    const activeQ = questions[currentIndex]
    const activeElapsed = Math.max(1, Math.round((Date.now() - questionStartTimeRef.current) / 1000))
    const finalTimes = {
      ...perQuestionSeconds,
      ...(activeQ ? { [activeQ.question_id]: (perQuestionSeconds[activeQ.question_id] || 0) + activeElapsed } : {}),
    }

    const answersPayload = questions.map((q) => {
      const selectedKey = selectedAnswers[q.question_id] || null
      const st = questionStatuses[q.question_id] || (selectedKey ? 'answered' : 'unanswered')
      const timeSpent = finalTimes[q.question_id] || 0

      return {
        question_id: q.question_id,
        selected_option_key: selectedKey,
        answer_status: st,
        time_spent_seconds: timeSpent,
      }
    })

    try {
      const res = await fetch('/api/student/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptId,
          time_taken_seconds: totalElapsedSeconds,
          answers: answersPayload,
        }),
      })

      const json = await res.json()
      if (json.success) {
        router.push(`/practice/result/${attemptId}`)
      } else {
        alert(json.error || 'Submission failed.')
        setSubmitting(false)
      }
    } catch (err) {
      console.error('Error submitting test:', err)
      setSubmitting(false)
    }
  }

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // -------------------------------------------------------------
  // PHASE 1: Loading
  // -------------------------------------------------------------
  if (examPhase === 'loading') {
    return <ExamPortalSkeleton />
  }

  // -------------------------------------------------------------
  // PHASE 2: Candidate Authentication Required Gatekeeper
  // -------------------------------------------------------------
  if (examPhase === 'auth_required') {
    return (
      <div className="min-h-screen bg-[#090909] text-[#FAFAFA] flex items-center justify-center p-4 font-sans selection:bg-[#222222] selection:text-white">
        <div className="max-w-md w-full bg-[#111111] border border-[#262626] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <ExamForgeLogo variant="badge" size={24} className="w-12 h-12 rounded-2xl mx-auto border-[#262626]" />
            <h2 className="text-xl font-black text-white">Candidate Verification Required</h2>
            <p className="text-xs text-[#A1A1AA]">
              परीक्षा में सम्मिलित होने के लिए कृपया अपना Candidate Profile चुनें।
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block">
              Choose Registered Candidate:
            </span>
            {availableStudents.map((st) => (
              <button
                key={st.id}
                onClick={() => handleSelectStudent(st)}
                className="w-full p-3.5 rounded-2xl bg-[#161616] hover:bg-[#202020] border border-[#262626] hover:border-[#3F3F46] text-left flex items-center justify-between transition-all cursor-pointer"
              >
                <div>
                  <div className="font-bold text-white text-sm">{st.full_name}</div>
                  <div className="text-[11px] text-[#71717A] font-mono">Candidate #{st.id} • {st.email}</div>
                </div>
                <Icons.ChevronRight size={16} className="text-[#A1A1AA]" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-[#262626]">
            <form onSubmit={handleCreateQuickStudent} className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#71717A] block">
                Or Enter New Candidate Name:
              </span>
              <input
                type="text"
                placeholder="Full Name (e.g. Puneet)"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#161616] border border-[#2B2B2B] text-white text-xs placeholder-[#71717A] focus:outline-none focus:border-white transition-colors"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-[#E5E5E5] transition-colors cursor-pointer"
              >
                Continue as Candidate
              </button>
            </form>
          </div>

          <div className="text-center">
            <Link href="/practice" className="text-xs text-[#A1A1AA] hover:text-white underline transition-colors">
              Return to Practice Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // PHASE 3: Official Verification & Instructions Screen (Pre-Exam)
  // -------------------------------------------------------------
  if (examPhase === 'instructions') {
    return (
      <div className="min-h-screen bg-[#090909] text-[#FAFAFA] flex flex-col font-sans selection:bg-[#222222] selection:text-white">
        {/* Top Minimal Bar */}
        <header className="h-16 bg-[#0C0C0C] border-b border-[#262626] px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExamForgeLogo variant="badge" size={18} className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-sm tracking-tight text-white">ExamForge Candidate Gatekeeper</span>
          </div>
          <Link
            href="/practice"
            className="text-xs text-[#A1A1AA] hover:text-white transition-colors flex items-center gap-1.5"
          >
            <span>Exit to Portal</span>
            <Icons.Close size={14} />
          </Link>
        </header>

        {/* Center Container */}
        <div className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-8 flex flex-col justify-center space-y-6">
          <div className="bg-[#111111] border border-[#262626] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
            {/* Header info */}
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#181818] text-[#A1A1AA] border border-[#2A2A2A] mb-3">
                <span>Official Assessment Verification</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {assessment?.title}
              </h1>
              <p className="text-xs md:text-sm text-[#A1A1AA] mt-1">
                Rajasthan Informatics Assistant (सूचना सहायक) Online Test Series
              </p>
            </div>

            {/* Candidate Identity Card */}
            <div className="rounded-2xl bg-[#161616] border border-[#262626] p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-black font-black text-base flex items-center justify-center">
                  {student?.full_name?.charAt(0) || 'P'}
                </div>
                <div>
                  <div className="text-xs text-[#71717A]">Authenticated Candidate:</div>
                  <div className="font-extrabold text-base text-white">{student?.full_name}</div>
                  <div className="text-[10px] text-[#A1A1AA] font-mono">Roll ID: #{student?.id} • {student?.email}</div>
                </div>
              </div>

              <button
                onClick={() => setExamPhase('auth_required')}
                className="text-[11px] text-[#A1A1AA] underline hover:text-white font-semibold cursor-pointer"
              >
                Change Candidate
              </button>
            </div>

            {/* Assessment Metrics Grid */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="rounded-2xl bg-[#161616] border border-[#262626] p-3">
                <div className="text-lg font-black font-mono text-white">{questions.length}</div>
                <div className="text-[10px] uppercase font-bold text-[#71717A]">Questions</div>
              </div>
              <div className="rounded-2xl bg-[#161616] border border-[#262626] p-3">
                <div className="text-lg font-black font-mono text-white">{assessment?.duration_minutes}m</div>
                <div className="text-[10px] uppercase font-bold text-[#71717A]">Duration</div>
              </div>
              <div className="rounded-2xl bg-[#161616] border border-[#262626] p-3">
                <div className="text-lg font-black font-mono text-white">+{Number(questions[0]?.marks || 1).toFixed(0)}</div>
                <div className="text-[10px] uppercase font-bold text-[#71717A]">Right Mark</div>
              </div>
              <div className="rounded-2xl bg-[#161616] border border-[#262626] p-3">
                <div className="text-lg font-black font-mono text-white">-{Number(questions[0]?.negative_marks || 0.25).toFixed(2)}</div>
                <div className="text-[10px] uppercase font-bold text-[#71717A]">Negative</div>
              </div>
            </div>

            {/* Exam Rules & Instructions */}
            <div className="rounded-2xl bg-[#161616]/70 border border-[#262626] p-5 space-y-2.5 text-xs text-[#A1A1AA] leading-relaxed">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-2">
                महत्वपूर्ण परीक्षा निर्देश (Important Examination Rules):
              </h3>
              <ul className="list-disc list-inside space-y-1.5 text-[#D4D4D8]">
                <li>
                  जैसे ही आप <strong>"Start Assessment"</strong> बटन दबाएंगे, आपका लाइव टाइमर शुरू हो जाएगा।
                </li>
                <li>
                  प्रत्येक प्रश्न को हल करने में लगा समय अलग से रिकॉर्ड किया जाएगा (Per-Question Time Analysis)।
                </li>
                <li>
                  परीक्षा के दौरान पेज रिफ्रेश (F5) या बैक बटन न दबाएं। बाहर निकलने के लिए <strong>Exit</strong> बटन पर पुष्टि अनिवार्य है।
                </li>
                <li>
                  समय समाप्त होने पर आपका टेस्ट स्वतः (Auto-Submit) हो जाएगा।
                </li>
              </ul>
            </div>

            {/* Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#161616] border border-[#303030] cursor-pointer select-none hover:border-[#404040] transition-colors">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-white cursor-pointer"
              />
              <span className="text-xs text-white font-medium">
                मैंने सभी नियम व निर्देश ध्यानपूर्वक पढ़ लिए हैं और मैं परीक्षा शुरू करने के लिए तैयार हूँ।
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/practice"
                className="flex-1 py-3.5 rounded-2xl bg-[#161616] hover:bg-[#202020] border border-[#2E2E2E] text-[#A1A1AA] hover:text-white font-bold text-xs text-center transition-colors"
              >
                रद्द करें (Cancel)
              </Link>
              <button
                type="button"
                disabled={!agreedToTerms || startingAttempt}
                onClick={handleStartExam}
                className={`flex-2 py-3.5 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${
                  agreedToTerms && !startingAttempt
                    ? 'bg-white text-black hover:bg-[#E5E5E5] cursor-pointer'
                    : 'bg-[#1F1F1F] text-[#52525B] cursor-not-allowed border border-[#262626]'
                }`}
              >
                {startingAttempt ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>Initializing Test...</span>
                  </>
                ) : (
                  <>
                    <span>परीक्षा आरंभ करें (Start Live Exam)</span>
                    <Icons.ChevronRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // PHASE 4: Live Exam (Laser-Focused, Distraction-Free UI/UX)
  // -------------------------------------------------------------
  const currentQ = questions[currentIndex]
  const currentSelectedOption = selectedAnswers[currentQ?.question_id] || null

  // Palette counts
  const answeredCount = Object.values(questionStatuses).filter((s) => s === 'answered').length
  const reviewCount = Object.values(questionStatuses).filter((s) => s === 'marked_for_review').length
  const unansweredCount = questions.length - answeredCount - reviewCount

  return (
    <div className="min-h-screen bg-[#090909] text-[#FAFAFA] flex flex-col font-sans select-none selection:bg-[#222222] selection:text-white">
      {/* 1. High-Contrast Distraction-Free Header */}
      <header className="sticky top-0 z-40 bg-[#0C0C0C]/90 backdrop-blur-md text-[#FAFAFA] px-4 md:px-8 py-3.5 border-b border-[#262626] flex items-center justify-between shadow-md">
        {/* Left: Test info & Candidate */}
        <div className="flex items-center gap-3">
          <ExamForgeLogo variant="badge" size={18} className="w-8 h-8 rounded-lg" />
          <div>
            <h1 className="font-extrabold text-xs md:text-sm leading-tight text-white truncate max-w-xs md:max-w-md">
              {assessment.title}
            </h1>
            <div className="text-[10px] text-[#71717A] font-mono flex items-center gap-2">
              <span>Candidate: <strong className="text-white">{student?.full_name}</strong></span>
              <span>•</span>
              <span>Q {currentIndex + 1} of {questions.length}</span>
            </div>
          </div>
        </div>

        {/* Right: Timers, Fullscreen, Palette Toggle, Exit Button, Submit Button */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Per-Question Live Ticker */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] text-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
            <span className="text-[#71717A] text-[11px]">This Q:</span>
            <span className="font-mono font-bold text-white">
              {formatTimer(currentQSeconds + (perQuestionSeconds[currentQ?.question_id] || 0))}
            </span>
          </div>

          {/* Overall Countdown */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141414] border border-[#262626] text-xs md:text-sm">
            <Icons.Clock size={15} className="text-[#FAFAFA]" />
            <span className="font-mono font-black text-white tracking-wider">
              {formatTimer(remainingSeconds)}
            </span>
          </div>

          {/* Bookmarks Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowBookmarksModal(true)}
            title="View saved question bookmarks"
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white border border-[#262626] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.BookmarkFilled size={13} className={bookmarkedQIds.size > 0 ? 'text-amber-400' : 'text-[#71717A]'} />
            <span className="hidden md:inline">Bookmarks</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[#222222] text-white font-mono font-bold text-[10px]">
              {bookmarkedQIds.size}
            </span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white border border-[#262626] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isFullscreen ? <Icons.Minimize size={14} /> : <Icons.Maximize size={14} />}
            <span className="hidden md:inline">{isFullscreen ? 'Exit Full' : 'Fullscreen'}</span>
          </button>

          {/* Palette Expand/Collapse Toggle Button */}
          <button
            type="button"
            onClick={() => setPaletteOpen((prev) => !prev)}
            title={paletteOpen ? 'Collapse Question Palette' : 'Expand Question Palette'}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white border border-[#262626] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-white"></span>
            <span className="hidden sm:inline">{paletteOpen ? 'Hide Palette' : 'Show Palette'}</span>
          </button>

          {/* Exit Exam Trigger Button */}
          <button
            type="button"
            onClick={() => setShowExitModal(true)}
            className="px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white border border-[#262626] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Icons.Close size={13} />
            <span className="hidden sm:inline">Exit Exam</span>
          </button>

          {/* Submit Test Trigger Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-[#E4E4E7] text-[#090909] font-bold text-xs transition-colors shadow-xs cursor-pointer"
          >
            Submit Test
          </button>
        </div>
      </header>

      {/* 2. Main Focused Examination Workspace */}
      <div className={`flex-1 max-w-7xl w-full mx-auto p-3 md:p-6 grid grid-cols-1 ${paletteOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-6 items-start transition-all`}>
        {/* Left Column: Active Question Statement & Options */}
        <div className={`${paletteOpen ? 'lg:col-span-3' : 'lg:col-span-1 max-w-4xl mx-auto w-full'} flex flex-col justify-between rounded-3xl bg-[#111111] border border-[#262626] p-5 md:p-8 shadow-xs transition-all`}>
          <div>
            {/* Question Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#262626] mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-white text-black font-mono font-black text-xs">
                  Question {currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-[#FAFAFA]">{currentQ?.subject_name}</span>
                <span className="text-[#3F3F46]">•</span>
                <span className="text-xs text-[#71717A]">{currentQ?.topic_name}</span>
              </div>

              <div className="flex items-center gap-2">
                {!paletteOpen && (
                  <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    className="px-3 py-1 rounded-xl bg-[#161616] hover:bg-[#202020] text-white border border-[#262626] font-mono font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Palette ({answeredCount}/{questions.length})</span>
                    <Icons.ChevronRight size={13} />
                  </button>
                )}

                {/* Question Bookmark Toggle Button */}
                {currentQ && (
                  <button
                    type="button"
                    onClick={handleToggleBookmark}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                      bookmarkedQIds.has(currentQ.question_id)
                        ? 'bg-amber-400 border-amber-500 text-black shadow-xs'
                        : 'bg-[#161616] hover:bg-[#202020] border-[#262626] text-[#A1A1AA] hover:text-white'
                    }`}
                    title={
                      bookmarkedQIds.has(currentQ.question_id)
                        ? 'Question Bookmarked (सहेजा गया)'
                        : 'Bookmark Question for Revision (बुकमार्क करें)'
                    }
                  >
                    {bookmarkedQIds.has(currentQ.question_id) ? (
                      <Icons.BookmarkFilled size={13} className="text-black" />
                    ) : (
                      <Icons.Bookmark size={13} className="text-[#A1A1AA]" />
                    )}
                    <span className="hidden sm:inline">
                      {bookmarkedQIds.has(currentQ.question_id) ? 'Bookmarked' : 'Bookmark'}
                    </span>
                  </button>
                )}

                {/* Interactive Multi-Language Switcher */}
                <div className="flex items-center rounded-xl bg-[#161616] p-0.5 border border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setLangMode('both')}
                    title="Show Bilingual (English + Hindi)"
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      langMode === 'both' ? 'bg-white text-black shadow-xs' : 'text-[#71717A] hover:text-white'
                    }`}
                  >
                    दोनों (Both)
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangMode('hi')}
                    title="हिंदी में देखें"
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      langMode === 'hi' ? 'bg-white text-black shadow-xs' : 'text-[#71717A] hover:text-white'
                    }`}
                  >
                    हिंदी
                  </button>
                  <button
                    type="button"
                    onClick={() => setLangMode('en')}
                    title="View in English"
                    className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      langMode === 'en' ? 'bg-white text-black shadow-xs' : 'text-[#71717A] hover:text-white'
                    }`}
                  >
                    English
                  </button>
                </div>

                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#161616] text-[#A1A1AA] border border-[#262626]">
                  +{Number(currentQ?.marks || 1).toFixed(1)} / -{Number(currentQ?.negative_marks || 0.25).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Question Statement (Supports Bilingual Hindi & English) */}
            <div className="space-y-2.5 mb-8">
              {(langMode === 'both' || langMode === 'en') && currentQ?.question_text && (
                <div className="text-lg md:text-xl font-bold text-[#FAFAFA] leading-relaxed">
                  {currentQ.question_text}
                </div>
              )}
              {(langMode === 'both' || langMode === 'hi') && (currentQ?.question_text_hi || (langMode === 'hi' && currentQ?.question_text)) && (
                <div className={`text-base md:text-lg leading-relaxed ${langMode === 'both' && currentQ?.question_text ? 'pt-2.5 border-t border-[#262626] text-[#D4D4D8] font-medium' : 'text-[#FAFAFA] font-bold'}`}>
                  {currentQ?.question_text_hi || currentQ?.question_text}
                </div>
              )}
            </div>

            {/* 4 Clean MCQ Option Cards (Supports Bilingual Hindi & English) */}
            <div className="space-y-3.5">
              {currentQ?.options?.map((opt) => {
                const isSelected = currentSelectedOption === opt.key
                return (
                  <div
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-2 border-white bg-white text-black shadow-md'
                        : 'border border-[#262626] bg-[#141414] hover:border-[#3F3F46] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Letter badge / Radio Indicator */}
                      <div
                        className={`w-9 h-9 rounded-xl font-mono font-bold text-sm flex items-center justify-center transition-colors shrink-0 ${
                          isSelected
                            ? 'bg-black text-white'
                            : 'bg-[#1E1E1E] text-[#D4D4D8] border border-[#303030]'
                        }`}
                      >
                        {opt.key}
                      </div>

                      {/* Option Text in Bilingual / Hindi / English */}
                      <div className="flex flex-col">
                        {(langMode === 'both' || langMode === 'en') && opt.text && (
                          <span className={`text-base ${isSelected ? 'text-black font-bold' : 'text-[#FAFAFA] font-medium'}`}>
                            {opt.text}
                          </span>
                        )}
                        {(langMode === 'both' || langMode === 'hi') && (opt.text_hi || (langMode === 'hi' && opt.text)) && (
                          <span className={`text-sm ${langMode === 'both' && opt.text ? isSelected ? 'text-neutral-800 mt-0.5 font-medium' : 'text-[#A1A1AA] mt-0.5 font-normal' : isSelected ? 'text-black font-bold text-base' : 'text-[#FAFAFA] font-medium text-base'}`}>
                            {opt.text_hi || opt.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Radio Dot */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-black bg-black' : 'border-[#3F3F46]'
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-8 pt-5 border-t border-[#262626] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearResponse}
                disabled={!currentSelectedOption}
                className="px-4 py-2.5 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Clear Response
              </button>

              <button
                type="button"
                onClick={handleMarkForReviewAndNext}
                className="px-4 py-2.5 rounded-xl border border-[#3F3F46] bg-[#181818] hover:bg-[#222222] text-[#FAFAFA] text-xs font-bold transition-colors cursor-pointer"
              >
                Mark for Review & Next
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => goToQuestion(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-[#262626] bg-[#141414] hover:bg-[#1E1E1E] text-[#A1A1AA] hover:text-white text-xs font-semibold disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Icons.ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndNext}
                className="px-6 py-2.5 rounded-xl bg-white hover:bg-[#E5E5E5] text-black font-black text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Save & Next</span>
                <Icons.ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Question Palette (Ultra Clean & Compact, Expandable/Collapsible) */}
        {paletteOpen && (
          <div className="lg:col-span-1 rounded-3xl bg-[#111111] border border-[#262626] p-5 shadow-xs space-y-4 lg:sticky lg:top-20 animate-in fade-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <div>
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#71717A] block">
                  Overview
                </span>
                <h2 className="text-sm font-black text-[#FAFAFA] tracking-tight">
                  Question Palette
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-white text-black">
                  {answeredCount}/{questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => setPaletteOpen(false)}
                  title="Collapse Palette"
                  className="p-1 rounded-lg text-[#71717A] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer"
                >
                  <Icons.Close size={15} />
                </button>
              </div>
            </div>

            {/* Completion Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-semibold text-[#A1A1AA]">
                <span>Completion Rate</span>
                <span className="font-mono text-[#FAFAFA] font-bold">
                  {Math.round((answeredCount / (questions.length || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1E1E1E] overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300 rounded-full"
                  style={{ width: `${(answeredCount / (questions.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Compact 3-Column Stats Counter */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-xl bg-[#161616] border border-[#262626] text-center">
                <div className="font-mono font-black text-[#FAFAFA] text-sm">{answeredCount}</div>
                <div className="text-[9px] uppercase font-bold text-[#71717A]">Answered</div>
              </div>
              <div className="p-2 rounded-xl bg-[#161616] border border-[#262626] text-center">
                <div className="font-mono font-black text-[#FAFAFA] text-sm">{reviewCount}</div>
                <div className="text-[9px] uppercase font-bold text-[#71717A]">Review</div>
              </div>
              <div className="p-2 rounded-xl bg-[#161616] border border-[#262626] text-center">
                <div className="font-mono font-black text-[#FAFAFA] text-sm">{unansweredCount}</div>
                <div className="text-[9px] uppercase font-bold text-[#71717A]">Skipped</div>
              </div>
            </div>

            {/* Quick Legend Pills */}
            <div className="flex items-center justify-between text-[10px] text-[#71717A] px-1 pt-0.5">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs bg-white inline-block"></span>
                <span>Answered</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-xs border border-white bg-transparent inline-block"></span>
                <span>Review</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                <span>Saved (★)</span>
              </span>
            </div>

            {/* Palette Filter Tabs */}
            <div className="flex items-center rounded-xl bg-[#161616] p-0.5 border border-[#262626] text-xs">
              <button
                type="button"
                onClick={() => setPaletteFilter('all')}
                className={`flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer ${
                  paletteFilter === 'all'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-[#71717A] hover:text-white'
                }`}
              >
                All ({questions.length})
              </button>
              <button
                type="button"
                onClick={() => setPaletteFilter('bookmarked')}
                className={`flex-1 py-1 rounded-lg font-bold text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  paletteFilter === 'bookmarked'
                    ? 'bg-white text-black shadow-xs'
                    : 'text-[#71717A] hover:text-white'
                }`}
              >
                <Icons.BookmarkFilled
                  size={11}
                  className={paletteFilter === 'bookmarked' ? 'text-amber-500' : 'text-amber-400'}
                />
                <span>Saved ({bookmarkedQIds.size})</span>
              </button>
            </div>

            {/* Numbered Palette Grid (Pixel-Perfect, No Ring Artifacts) */}
            <div className="pt-2">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex
                  const status = questionStatuses[q.question_id]
                  const isAnswered = status === 'answered'
                  const isReview = status === 'marked_for_review'
                  const isBookmarked = bookmarkedQIds.has(q.question_id)

                  if (paletteFilter === 'bookmarked' && !isBookmarked) {
                    return null
                  }

                  let style = 'bg-[#161616] text-[#71717A] hover:text-white hover:bg-[#202020] border border-[#262626]'
                  if (isAnswered) {
                    style = 'bg-white text-black font-bold border border-white shadow-xs'
                  } else if (isReview) {
                    style = 'bg-[#141414] text-white font-bold border-2 border-white'
                  }

                  return (
                    <button
                      key={q.question_id}
                      type="button"
                      onClick={() => goToQuestion(idx)}
                      className={`relative h-9 w-full rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${style} ${
                        isCurrent
                          ? 'ring-2 ring-white scale-105 z-10 font-black'
                          : ''
                      }`}
                    >
                      {idx + 1}
                      {isBookmarked && (
                        <span
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#111111]"
                          title="Bookmarked Question"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
              {paletteFilter === 'bookmarked' && bookmarkedQIds.size === 0 && (
                <div className="text-center py-6 text-xs text-[#71717A]">
                  No questions saved yet. Click the Bookmark button to save difficult questions for review.
                </div>
              )}
            </div>

            {/* Bottom Submit CTA Button (No awkward empty space) */}
            <div className="pt-3 border-t border-[#262626] space-y-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-3 rounded-xl bg-white hover:bg-[#E5E5E5] text-black font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span>Submit Entire Assessment</span>
                <Icons.ChevronRight size={14} />
              </button>
              <p className="text-[10px] text-center text-[#71717A] font-mono">
                Live Auto-Save Enabled
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL 1: Exit Confirmation Alert Window                       */}
      {/* ------------------------------------------------------------- */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#262626] space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#262626] text-amber-400 mx-auto flex items-center justify-center text-xl font-bold">
                ⚠️
              </div>
              <h3 className="text-xl font-black text-white">
                क्या आप वाकई परीक्षा छोड़ना चाहते हैं?
              </h3>
              <p className="text-xs text-[#A1A1AA]">
                Are you sure you want to quit the examination?
              </p>
            </div>

            <div className="rounded-2xl bg-[#161616] border border-[#262626] p-4 text-xs text-[#D4D4D8] space-y-2">
              <div className="font-semibold text-white">
                ⚠️ महत्वपूर्ण चेतावनी (Critical Warning):
              </div>
              <p className="text-[#A1A1AA]">
                यदि आप अभी परीक्षा छोड़ते हैं, तो आपका यह टेस्ट अपूर्ण (Incomplete) रहेगा और आपका परिणाम दर्ज नहीं होगा।
              </p>
              <div className="pt-2 border-t border-[#262626] flex justify-between font-mono font-bold text-white">
                <span>उत्तर दिए गए प्रश्न:</span>
                <span>{answeredCount} / {questions.length}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-[#E5E5E5] text-black font-bold text-xs transition-colors shadow-xs cursor-pointer"
              >
                परीक्षा जारी रखें (Stay in Exam)
              </button>
              <button
                type="button"
                onClick={() => router.push('/practice')}
                className="py-3 px-4 rounded-xl border border-[#262626] bg-[#161616] hover:bg-[#202020] text-[#A1A1AA] hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                हाँ, परीक्षा छोड़ें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL 2: Final Submit Confirmation Window                     */}
      {/* ------------------------------------------------------------- */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] rounded-3xl max-w-md w-full p-6 md:p-8 shadow-2xl border border-[#262626] space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] border border-[#262626] text-white mx-auto flex items-center justify-center">
                <Icons.Check size={24} />
              </div>
              <h3 className="text-xl font-black text-white">Submit Assessment?</h3>
              <p className="text-xs text-[#A1A1AA]">
                Are you ready to submit your exam and view instant analytics?
              </p>
            </div>

            {/* Summary statistics */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-[#161616] border border-[#262626]">
                <div className="text-lg font-black font-mono text-white">{answeredCount}</div>
                <div className="text-[10px] uppercase font-bold text-[#71717A]">Answered</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#161616] border border-[#262626]">
                <div className="text-lg font-black font-mono text-white">{reviewCount}</div>
                <div className="text-[10px] uppercase font-bold text-[#71717A]">Review</div>
              </div>
              <div className="p-3 rounded-2xl bg-[#161616] border border-[#262626]">
                <div className="text-lg font-black font-mono text-white">{unansweredCount}</div>
                <div className="text-[10px] uppercase font-bold text-[#71717A]">Skipped</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#262626] bg-[#161616] hover:bg-[#202020] text-[#A1A1AA] hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Resume Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="flex-1 py-3 rounded-xl bg-white hover:bg-[#E5E5E5] text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-40"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bookmarks Modal */}
      {student && (
        <BookmarkModal
          isOpen={showBookmarksModal}
          onClose={() => setShowBookmarksModal(false)}
          studentId={student.id}
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
