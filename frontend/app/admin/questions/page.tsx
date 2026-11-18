'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { QuestionBankSkeleton } from '@/app/components/Shimmer'

function QuestionsContent() {
  const searchParams = useSearchParams()

  const [questions, setQuestions] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all')

  // Expanded question for detailed view
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Form states
  const [formSubjectId, setFormSubjectId] = useState<number | ''>('')
  const [formTopicId, setFormTopicId] = useState<number | ''>('')
  const [questionText, setQuestionText] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [status, setStatus] = useState<'draft' | 'pending' | 'approved' | 'rejected'>('approved')
  const [languageCode, setLanguageCode] = useState<'hi' | 'en'>('hi')
  const [defaultMarks, setDefaultMarks] = useState<number>(1.0)
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(0.25)
  const [explanation, setExplanation] = useState('')
  const [options, setOptions] = useState([
    { key: 'A', text: '', isCorrect: true },
    { key: 'B', text: '', isCorrect: false },
    { key: 'C', text: '', isCorrect: false },
    { key: 'D', text: '', isCorrect: false },
  ])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedSubject !== 'all') params.append('subject_id', selectedSubject)
      if (selectedTopic !== 'all') params.append('topic_id', selectedTopic)
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty)
      if (selectedStatus !== 'all') params.append('status', selectedStatus)
      if (selectedLanguage !== 'all') params.append('language', selectedLanguage)
      if (search.trim()) params.append('search', search.trim())

      const res = await fetch(`/api/admin/questions?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setQuestions(json.questions)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadFilterData = async () => {
    try {
      const [resSubs, resTops] = await Promise.all([
        fetch('/api/admin/subjects').then((r) => r.json()),
        fetch('/api/admin/topics').then((r) => r.json()),
      ])
      if (resSubs.success) setSubjects(resSubs.subjects)
      if (resTops.success) setTopics(resTops.topics)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadFilterData()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [selectedSubject, selectedTopic, selectedDifficulty, selectedStatus, selectedLanguage])

  // Trigger modal if ?action=new is in query string
  useEffect(() => {
    if (searchParams.get('action') === 'new' && subjects.length > 0) {
      handleOpenAdd()
    }
  }, [searchParams, subjects])

  const handleOpenAdd = () => {
    setEditingQuestion(null)
    const firstSubId = subjects[0]?.id || 1
    setFormSubjectId(firstSubId)
    const subTopics = topics.filter((t) => t.subject_id === firstSubId)
    setFormTopicId(subTopics[0]?.id || '')
    setQuestionText('')
    setDifficulty('medium')
    setStatus('approved')
    setLanguageCode('hi')
    setDefaultMarks(1.0)
    setDefaultNegativeMarks(0.25)
    setExplanation('')
    setOptions([
      { key: 'A', text: '', isCorrect: true },
      { key: 'B', text: '', isCorrect: false },
      { key: 'C', text: '', isCorrect: false },
      { key: 'D', text: '', isCorrect: false },
    ])
    setIsModalOpen(true)
  }

  const handleOpenEdit = (q: any) => {
    setEditingQuestion(q)
    setFormSubjectId(q.subject_id)
    setFormTopicId(q.topic_id)
    setQuestionText(q.question_text)
    setDifficulty(q.difficulty || 'medium')
    setStatus(q.status || 'approved')
    setLanguageCode(q.language_code || 'en')
    setDefaultMarks(Number(q.default_marks || 1.0))
    setDefaultNegativeMarks(Number(q.default_negative_marks || 0.25))
    setExplanation(q.explanation || '')
    setOptions(
      q.options && q.options.length > 0
        ? q.options.map((o: any) => ({
            key: o.key,
            text: o.text,
            isCorrect: Boolean(o.isCorrect),
          }))
        : [
            { key: 'A', text: '', isCorrect: true },
            { key: 'B', text: '', isCorrect: false },
            { key: 'C', text: '', isCorrect: false },
            { key: 'D', text: '', isCorrect: false },
          ]
    )
    setIsModalOpen(true)
  }

  const handleCorrectOptionChange = (key: string) => {
    setOptions((prev) =>
      prev.map((opt) => ({
        ...opt,
        isCorrect: opt.key === key,
      }))
    )
  }

  const handleOptionTextChange = (key: string, text: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.key === key ? { ...opt, text } : opt))
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formSubjectId || !formTopicId || !questionText.trim()) {
      return alert('Subject, topic, and question text are required.')
    }

    const hasEmptyOption = options.some((o) => !o.text.trim())
    if (hasEmptyOption) {
      return alert('All 4 option choices must have text filled in.')
    }

    try {
      const payload = {
        subject_id: formSubjectId,
        topic_id: formTopicId,
        question_text: questionText,
        difficulty,
        status,
        language_code: languageCode,
        default_marks: defaultMarks,
        default_negative_marks: defaultNegativeMarks,
        explanation,
        options,
      }

      const method = editingQuestion ? 'PUT' : 'POST'
      const url = '/api/admin/questions'
      const body = editingQuestion ? { ...payload, id: editingQuestion.id } : payload

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (json.success) {
        setIsModalOpen(false)
        fetchQuestions()
      } else {
        alert(json.error || 'Failed to save question')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving question')
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        fetchQuestions()
      } else {
        alert(json.error || 'Failed to update status')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteConfirmId(null)
        fetchQuestions()
      } else {
        alert(json.error || 'Failed to delete question')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const filterTopics =
    selectedSubject === 'all'
      ? topics
      : topics.filter((t) => t.subject_id === Number(selectedSubject))

  const formTopics =
    formSubjectId === ''
      ? []
      : topics.filter((t) => t.subject_id === Number(formSubjectId))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Question Bank</h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Curated Rajasthan Informatics Assistant MCQ repository with bilingual support (Hindi & English).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
        >
          <Icons.Plus size={15} />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Icons.Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
            />
            <input
              type="text"
              placeholder="Search question statement or explanation..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchQuestions()}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value)
                setSelectedTopic('all')
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
            >
              <option value="all" className="bg-[#151515] text-[#FAFAFA]">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id} className="bg-[#151515] text-[#FAFAFA]">
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
            >
              <option value="all" className="bg-[#151515] text-[#FAFAFA]">All Topics</option>
              {filterTopics.map((top) => (
                <option key={top.id} value={top.id} className="bg-[#151515] text-[#FAFAFA]">
                  {top.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
            >
              <option value="all" className="bg-[#151515] text-[#FAFAFA]">All Difficulties</option>
              <option value="easy" className="bg-[#151515] text-[#FAFAFA]">Easy</option>
              <option value="medium" className="bg-[#151515] text-[#FAFAFA]">Medium</option>
              <option value="hard" className="bg-[#151515] text-[#FAFAFA]">Hard</option>
            </select>
          </div>

          {/* Language Filter */}
          <div>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
            >
              <option value="all" className="bg-[#151515] text-[#FAFAFA]">All Languages</option>
              <option value="hi" className="bg-[#151515] text-[#FAFAFA]">Hindi (हिंदी)</option>
              <option value="en" className="bg-[#151515] text-[#FAFAFA]">English</option>
            </select>
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center justify-between pt-2 border-t border-[#1F1F1F] text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#71717A] font-mono font-medium uppercase text-[10px] mr-1">Status:</span>
            {['all', 'approved', 'pending', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg font-mono font-semibold uppercase text-[10px] transition-colors ${
                  selectedStatus === st
                    ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                    : 'bg-[#151515] text-[#71717A] border border-[#262626] hover:text-[#FAFAFA]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
          <div className="font-mono text-[11px] text-[#71717A]">{questions.length} questions loaded</div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <QuestionBankSkeleton />
      ) : questions.length === 0 ? (
        <div className="p-12 text-center text-[#71717A] bg-[#111111] rounded-2xl border border-[#262626] space-y-3">
          <p className="text-xs font-semibold text-[#A1A1AA]">No questions found matching your filter criteria.</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAFAFA] text-[#090909] text-xs font-semibold hover:bg-[#E4E4E7]"
          >
            <Icons.Plus size={14} /> Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q) => {
            const isExpanded = expandedId === q.id
            const isApproved = q.status === 'approved'

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#3F3F46] transition-all"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-[#FAFAFA]">Q#{q.id}</span>
                    <span className="text-[#52525B]">•</span>
                    <span className="text-xs font-semibold text-[#FAFAFA]">{q.subject_name}</span>
                    <span className="text-[#52525B]">•</span>
                    <span className="text-xs text-[#71717A]">{q.topic_name}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#151515] text-[#A1A1AA] border border-[#262626]">
                      {q.language_code === 'hi' ? 'हिंदी (HI)' : 'ENG (EN)'}
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#151515] text-[#71717A] border border-[#262626]">
                      {q.difficulty}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        q.status === 'approved'
                          ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                          : q.status === 'pending'
                          ? 'bg-[#151515] text-[#A1A1AA] border border-[#262626]'
                          : 'bg-[#151515] text-[#52525B] border border-[#262626]'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                </div>

                {/* Question Statement */}
                <h3 className="text-xs sm:text-sm font-semibold text-[#FAFAFA] leading-relaxed mb-4">
                  {q.question_text}
                </h3>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                  {q.options?.map((opt: any) => (
                    <div
                      key={opt.key}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        opt.isCorrect
                          ? 'bg-[#191919] border-[#3F3F46] text-[#FAFAFA] font-medium'
                          : 'bg-[#151515] border-[#262626] text-[#A1A1AA]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center font-mono font-bold text-[10px] ${
                            opt.isCorrect ? 'bg-[#FAFAFA] text-[#090909]' : 'bg-[#202020] text-[#71717A]'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      {opt.isCorrect && (
                        <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[#FAFAFA] text-[#090909]">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Explanation accordion */}
                {isExpanded && q.explanation && (
                  <div className="p-3.5 rounded-xl bg-[#151515] border border-[#262626] text-xs text-[#A1A1AA] mb-4 space-y-1">
                    <span className="font-mono font-bold text-[#FAFAFA] uppercase text-[10px] block">
                      Explanation / व्याख्या:
                    </span>
                    <p className="leading-relaxed">{q.explanation}</p>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1F1F1F] text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : q.id)}
                    className="text-[#71717A] hover:text-[#FAFAFA] font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Explanation' : 'View Explanation'}</span>
                    <Icons.ChevronDown
                      size={13}
                      className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <div className="flex items-center gap-2">
                    {!isApproved ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(q.id, 'approved')}
                        className="px-3 py-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] font-semibold text-xs transition-colors"
                      >
                        Approve Question
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(q.id, 'pending')}
                        className="px-3 py-1.5 rounded-lg bg-[#171717] hover:bg-[#202020] text-[#A1A1AA] border border-[#262626] font-medium text-xs transition-colors"
                      >
                        Mark Pending
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(q)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors"
                      title="Edit Question"
                    >
                      <Icons.Edit size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(q.id)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Delete Question"
                    >
                      <Icons.Trash size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Question Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Question' : 'Add Question to Bank'}
        subtitle="Specify question statement, options, correct answer, and explanation"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Subject */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Subject *
              </label>
              <select
                required
                value={formSubjectId}
                onChange={(e) => {
                  const sId = Number(e.target.value)
                  setFormSubjectId(sId)
                  const subTopics = topics.filter((t) => t.subject_id === sId)
                  setFormTopicId(subTopics[0]?.id || '')
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#151515] text-[#FAFAFA]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Topic *
              </label>
              <select
                required
                value={formTopicId}
                onChange={(e) => setFormTopicId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
              >
                {formTopics.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#151515] text-[#FAFAFA]">
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Language *
              </label>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value as 'hi' | 'en')}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
              >
                <option value="hi" className="bg-[#151515] text-[#FAFAFA]">Hindi (हिंदी)</option>
                <option value="en" className="bg-[#151515] text-[#FAFAFA]">English</option>
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Question Statement *
            </label>
            <textarea
              required
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Enter the full question text here..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          {/* 4 MCQ Options */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1.5">
              4 Selectable Options (Radio Select Correct Answer) *
            </label>
            <div className="space-y-2">
              {options.map((opt) => (
                <div
                  key={opt.key}
                  className={`flex items-center gap-3 p-2 rounded-xl border transition-colors ${
                    opt.isCorrect
                      ? 'border-[#3F3F46] bg-[#191919]'
                      : 'border-[#262626] bg-[#151515]'
                  }`}
                >
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0 font-bold text-xs text-[#FAFAFA]">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.isCorrect}
                      onChange={() => handleCorrectOptionChange(opt.key)}
                      className="accent-white w-4 h-4 cursor-pointer"
                    />
                    <span className="font-mono">Option {opt.key}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(opt.key, e.target.value)}
                    placeholder={`Enter text for Option ${opt.key}...`}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#262626] bg-[#111111] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Marks & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
              >
                <option value="easy" className="bg-[#151515] text-[#FAFAFA]">Easy</option>
                <option value="medium" className="bg-[#151515] text-[#FAFAFA]">Medium</option>
                <option value="hard" className="bg-[#151515] text-[#FAFAFA]">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Positive Marks
              </label>
              <input
                type="number"
                step="0.25"
                value={defaultMarks}
                onChange={(e) => setDefaultMarks(parseFloat(e.target.value))}
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
                value={defaultNegativeMarks}
                onChange={(e) => setDefaultNegativeMarks(parseFloat(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Detailed Solution & Explanation (व्याख्या)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Step-by-step reasoning or formula breakdown..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#202020] hover:text-[#FAFAFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
            >
              {editingQuestion ? 'Update Question' : 'Save to Bank'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Question"
        subtitle="Confirm question removal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Are you sure you want to delete this question? It will be removed from future tests.
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
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
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

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#71717A]">Loading Question Bank...</div>}>
      <QuestionsContent />
    </Suspense>
  )
}
