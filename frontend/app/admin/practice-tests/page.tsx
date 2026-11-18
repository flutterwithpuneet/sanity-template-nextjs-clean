'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { TableSkeleton } from '@/app/components/Shimmer'

function PracticeTestsContent() {
  const searchParams = useSearchParams()

  const [tests, setTests] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [approvedQuestions, setApprovedQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Builder modal
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Form fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assessmentType, setAssessmentType] = useState<
    'mock' | 'sectional' | 'topic_test' | 'full_length' | 'practice'
  >('mock')
  const [difficultyLevel, setDifficultyLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [passingPercentage, setPassingPercentage] = useState<number>(40)
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(1.0)
  const [negativeMarksPerQuestion, setNegativeMarksPerQuestion] = useState<number>(0.25)

  // Question filter inside builder
  const [builderSubjectId, setBuilderSubjectId] = useState<string>('all')
  const [builderTopicId, setBuilderTopicId] = useState<string>('all')
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([])

  const loadAll = async () => {
    try {
      setLoading(true)
      const [resTests, resSubs, resTops, resQs] = await Promise.all([
        fetch('/api/admin/mock-tests').then((r) => r.json()),
        fetch('/api/admin/subjects').then((r) => r.json()),
        fetch('/api/admin/topics').then((r) => r.json()),
        fetch('/api/admin/questions?status=approved&limit=200').then((r) => r.json()),
      ])
      if (resTests.success) setTests(resTests.tests)
      if (resSubs.success) setSubjects(resSubs.subjects)
      if (resTops.success) setTopics(resTops.topics)
      if (resQs.success) setApprovedQuestions(resQs.questions)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      handleOpenCreate()
    }
  }, [searchParams])

  const handleOpenCreate = () => {
    setTitle('')
    setDescription('')
    setAssessmentType('mock')
    setDifficultyLevel('medium')
    setDurationMinutes(60)
    setPassingPercentage(40)
    setMarksPerQuestion(1.0)
    setNegativeMarksPerQuestion(0.25)
    setBuilderSubjectId('all')
    setBuilderTopicId('all')
    setSelectedQuestionIds([])
    setIsBuilderOpen(true)
  }

  const toggleQuestionSelection = (qId: number) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    )
  }

  const eligibleQuestions = approvedQuestions.filter((q) => {
    const matchSub = builderSubjectId === 'all' || q.subject_id === Number(builderSubjectId)
    const matchTop = builderTopicId === 'all' || q.topic_id === Number(builderTopicId)
    return matchSub && matchTop
  })

  const selectAllEligible = () => {
    const ids = eligibleQuestions.map((q) => q.id)
    setSelectedQuestionIds((prev) => Array.from(new Set([...prev, ...ids])))
  }

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return alert('Test title is required')
    if (selectedQuestionIds.length === 0) {
      return alert('Please select at least 1 question for this test.')
    }

    try {
      const payload = {
        title,
        description,
        assessment_type: assessmentType,
        difficulty_level: difficultyLevel,
        subject_id: builderSubjectId !== 'all' ? Number(builderSubjectId) : null,
        duration_minutes: durationMinutes,
        passing_percentage: passingPercentage,
        selected_question_ids: selectedQuestionIds,
        marks_per_question: marksPerQuestion,
        negative_marks_per_question: negativeMarksPerQuestion,
        status: 'published',
      }

      const res = await fetch('/api/admin/mock-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (json.success) {
        setIsBuilderOpen(false)
        loadAll()
      } else {
        alert(json.error || 'Failed to create assessment')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating assessment')
    }
  }

  const handleDeleteTest = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/mock-tests?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteConfirmId(null)
        loadAll()
      } else {
        alert(json.error || 'Failed to delete test')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const totalCalculatedMarks = (selectedQuestionIds.length * marksPerQuestion).toFixed(1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Mock Tests & Practice Builder</h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Build full-length mock drills, sectional tests, and practice papers with checkbox question curation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/practice"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-[#171717] border border-[#262626] hover:bg-[#202020] hover:border-[#3F3F46] text-[#FAFAFA] font-medium text-xs transition-colors flex items-center gap-2"
          >
            <Icons.CandidatePortal size={15} />
            Try Student View
          </Link>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors flex items-center gap-2"
          >
            <Icons.Plus size={15} />
            <span>Create Test</span>
          </button>
        </div>
      </div>

      {/* Tests Grid */}
      {loading ? (
        <TableSkeleton cols={6} rows={5} />
      ) : tests.length === 0 ? (
        <div className="p-12 text-center text-[#71717A] bg-[#111111] rounded-2xl border border-[#262626] space-y-3">
          <p className="text-xs font-semibold text-[#A1A1AA]">No mock tests created yet.</p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAFAFA] text-[#090909] text-xs font-semibold hover:bg-[#E4E4E7]"
          >
            <Icons.Plus size={14} /> Create First Practice Drill
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {tests.map((test) => (
            <div
              key={test.id}
              className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#3F3F46] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#151515] text-[#FAFAFA] border border-[#262626]">
                    {test.assessment_type}
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]">
                    {test.difficulty_level || 'medium'}
                  </span>
                  <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-[#151515] text-[#A1A1AA] border border-[#262626]">
                    {test.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#FAFAFA] mb-1.5 leading-snug">
                  {test.title}
                </h3>
                <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-4 leading-relaxed">
                  {test.description || 'Practice test with selected syllabus questions.'}
                </p>
              </div>

              <div>
                <div className="grid grid-cols-3 gap-2 py-2.5 border-t border-[#1F1F1F] text-center text-xs text-[#71717A] mb-3 bg-[#151515] border border-[#262626] rounded-xl p-2 font-mono">
                  <div>
                    <div className="font-bold text-[#FAFAFA] text-xs">{test.actual_question_count || test.total_questions}</div>
                    <div className="text-[9px] text-[#71717A] uppercase">Questions</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#FAFAFA] text-xs">{test.duration_minutes}m</div>
                    <div className="text-[9px] text-[#71717A] uppercase">Duration</div>
                  </div>
                  <div>
                    <div className="font-bold text-[#FAFAFA] text-xs">{Number(test.total_marks || 0).toFixed(0)}</div>
                    <div className="text-[9px] text-[#71717A] uppercase">Marks</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-[#71717A] mb-3 font-mono text-[11px]">
                  <span>Attempts: <strong className="text-[#FAFAFA]">{test.attempts_count || 0}</strong></span>
                  <span>Pass: <strong className="text-[#FAFAFA]">{test.passing_percentage}%</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/practice/${test.id}`}
                    target="_blank"
                    className="flex-1 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Launch Test ↗</span>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirmId(test.id)}
                    className="p-2 rounded-xl bg-[#171717] border border-[#262626] hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/40 text-[#71717A] transition-colors"
                    title="Delete Test"
                  >
                    <Icons.Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Test Builder Modal */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title="Practice Test Builder"
        subtitle="Select questions using checkboxes and configure test parameters"
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveTest} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Test Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Rajasthan IA Full-Length Mock Drill 02"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Assessment Type *
              </label>
              <select
                value={assessmentType}
                onChange={(e) => setAssessmentType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B]"
              >
                <option value="mock" className="bg-[#151515] text-[#FAFAFA]">Full-Length Mock</option>
                <option value="sectional" className="bg-[#151515] text-[#FAFAFA]">Sectional Test</option>
                <option value="topic_test" className="bg-[#151515] text-[#FAFAFA]">Topic Test</option>
                <option value="practice" className="bg-[#151515] text-[#FAFAFA]">Practice Drill</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Difficulty Category *
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B]"
              >
                <option value="low" className="bg-[#151515] text-[#FAFAFA]">Low Level (सरल / Basic)</option>
                <option value="medium" className="bg-[#151515] text-[#FAFAFA]">Medium Level (मध्यम / Standard)</option>
                <option value="high" className="bg-[#151515] text-[#FAFAFA]">High Level (कठिन / Advanced)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Duration (Mins)
              </label>
              <input
                type="number"
                min="5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Marks / Question
              </label>
              <input
                type="number"
                step="0.25"
                value={marksPerQuestion}
                onChange={(e) => setMarksPerQuestion(parseFloat(e.target.value) || 1.0)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Negative Marks
              </label>
              <input
                type="number"
                step="0.05"
                value={negativeMarksPerQuestion}
                onChange={(e) => setNegativeMarksPerQuestion(parseFloat(e.target.value) || 0.25)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Pass Percentage
              </label>
              <input
                type="number"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(parseFloat(e.target.value) || 40)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>
          </div>

          {/* Question Filter & Selection Section */}
          <div className="border border-[#262626] rounded-2xl p-4 bg-[#151515] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="text-[11px] font-mono font-bold text-[#FAFAFA] uppercase">
                Select Questions ({selectedQuestionIds.length} Selected • {totalCalculatedMarks} Total Marks)
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllEligible}
                  className="px-2.5 py-1 rounded-lg bg-[#FAFAFA] text-[#090909] text-[11px] font-semibold hover:bg-[#E4E4E7]"
                >
                  Select All Visible
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedQuestionIds([])}
                  className="px-2.5 py-1 rounded-lg bg-[#202020] border border-[#262626] text-[#A1A1AA] text-[11px] font-medium hover:text-[#FAFAFA]"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={builderSubjectId}
                onChange={(e) => setBuilderSubjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#111111] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
              >
                <option value="all" className="bg-[#111111] text-[#FAFAFA]">Filter by Subject (All)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#111111] text-[#FAFAFA]">
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={builderTopicId}
                onChange={(e) => setBuilderTopicId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#111111] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
              >
                <option value="all" className="bg-[#111111] text-[#FAFAFA]">Filter by Topic (All)</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#111111] text-[#FAFAFA]">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Checkbox list of questions */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {eligibleQuestions.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#71717A]">
                  No approved questions matching filters.
                </div>
              ) : (
                eligibleQuestions.map((q) => {
                  const isChecked = selectedQuestionIds.includes(q.id)
                  return (
                    <label
                      key={q.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-[#191919] border-[#3F3F46]'
                          : 'bg-[#111111] border-[#262626] hover:border-[#3F3F46]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleQuestionSelection(q.id)}
                        className="mt-1 accent-white w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-[#71717A]">#{q.id}</span>
                          <span className="text-[10px] font-bold text-[#FAFAFA]">{q.subject_name}</span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#151515] text-[#A1A1AA] border border-[#262626]">
                            {q.language_code || 'en'}
                          </span>
                        </div>
                        <p className="text-xs text-[#A1A1AA] font-medium line-clamp-2 leading-relaxed">
                          {q.question_text}
                        </p>
                      </div>
                    </label>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#202020] hover:text-[#FAFAFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
            >
              Save & Publish Test
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Mock Test"
        subtitle="Confirm test removal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Are you sure you want to delete this test? Student attempts for this test will be removed.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#202020] hover:text-[#FAFAFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteConfirmId && handleDeleteTest(deleteConfirmId)}
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

export default function PracticeTestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#71717A]">Loading Practice Tests...</div>}>
      <PracticeTestsContent />
    </Suspense>
  )
}
