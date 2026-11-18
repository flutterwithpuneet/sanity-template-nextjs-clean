'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Icons } from '@/components/admin/Icons'

interface Option {
  id: number
  key: string
  text: string
  text_hi?: string
  is_correct: boolean
}

export interface BookmarkedQuestion {
  bookmark_id: number
  student_id: number
  question_id: number
  note: string | null
  bookmarked_at: string
  question_text: string
  question_text_hi?: string
  question_type: string
  difficulty: string
  explanation?: string
  explanation_hi?: string
  default_marks?: number
  default_negative_marks?: number
  subject_id: number
  subject_name: string
  subject_code: string
  topic_id?: number
  topic_name?: string
  options: Option[]
}

interface BookmarkModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: number
  onBookmarkRemoved?: (questionId: number) => void
}

export default function BookmarkModal({
  isOpen,
  onClose,
  studentId,
  onBookmarkRemoved,
}: BookmarkModalProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkedQuestion[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('all')
  const [langMode, setLangMode] = useState<'both' | 'hi' | 'en'>('both')
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({})
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null)
  const [noteText, setNoteText] = useState<string>('')
  const [savingNote, setSavingNote] = useState<boolean>(false)

  // Fetch bookmarks when opened
  useEffect(() => {
    if (!isOpen || !studentId) return

    let cancelled = false
    const fetchBookmarks = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/student/bookmarks?student_id=${studentId}`)
        const data = await res.json()
        if (!cancelled) {
          if (data.success) {
            setBookmarks(data.bookmarks || [])
          } else {
            setError(data.error || 'Failed to load bookmarks')
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Network error')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchBookmarks()
    return () => {
      cancelled = true
    }
  }, [isOpen, studentId])

  // Extract distinct subjects
  const availableSubjects = useMemo(() => {
    const map = new Map<number, string>()
    bookmarks.forEach((b) => {
      if (b.subject_id && b.subject_name) {
        map.set(b.subject_id, b.subject_name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id: String(id), name }))
  }, [bookmarks])

  // Filtered bookmarks
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchesSubject =
        selectedSubject === 'all' || String(b.subject_id) === selectedSubject
      if (!matchesSubject) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      const textEn = (b.question_text || '').toLowerCase()
      const textHi = (b.question_text_hi || '').toLowerCase()
      const topic = (b.topic_name || '').toLowerCase()
      const note = (b.note || '').toLowerCase()
      return (
        textEn.includes(q) ||
        textHi.includes(q) ||
        topic.includes(q) ||
        note.includes(q)
      )
    })
  }, [bookmarks, selectedSubject, searchQuery])

  // Remove a bookmark
  const handleRemoveBookmark = async (questionId: number) => {
    // Optimistic removal
    setBookmarks((prev) => prev.filter((b) => b.question_id !== questionId))
    if (onBookmarkRemoved) onBookmarkRemoved(questionId)

    try {
      await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          action: 'remove',
        }),
      })
    } catch (err) {
      console.error('Failed to remove bookmark from server', err)
    }
  }

  // Toggle explanation accordion
  const toggleExplanation = (questionId: number) => {
    setExpandedSolutions((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }))
  }

  // Save note for a question
  const handleSaveNote = async (questionId: number) => {
    setSavingNote(true)
    try {
      await fetch('/api/student/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          note: noteText.trim() || null,
          action: 'add',
        }),
      })
      setBookmarks((prev) =>
        prev.map((b) =>
          b.question_id === questionId ? { ...b, note: noteText.trim() || null } : b
        )
      )
      setEditingNoteId(null)
    } catch (err) {
      console.error('Failed to save note', err)
    } finally {
      setSavingNote(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#121212] border border-[#2B2B2B] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#FAFAFA]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#262626] flex items-center justify-between bg-[#151515] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center shadow-xs">
              <Icons.BookmarkFilled size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Saved Bookmarks (सहेजे गए प्रश्न)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#262626] text-xs font-mono font-bold text-[#FAFAFA]">
                  {bookmarks.length}
                </span>
              </div>
              <p className="text-[11px] text-[#A1A1AA]">
                Questions you saved during practice or tests for targeted revision
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switch */}
            <div className="hidden sm:flex items-center rounded-xl bg-[#202020] p-0.5 border border-[#303030]">
              <button
                type="button"
                onClick={() => setLangMode('both')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  langMode === 'both' ? 'bg-white text-black' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                दोनों (Both)
              </button>
              <button
                type="button"
                onClick={() => setLangMode('hi')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  langMode === 'hi' ? 'bg-white text-black' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <button
                type="button"
                onClick={() => setLangMode('en')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                  langMode === 'en' ? 'bg-white text-black' : 'text-[#A1A1AA] hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#A1A1AA] hover:text-white hover:bg-[#202020] transition-colors"
              aria-label="Close"
            >
              <Icons.Close size={18} />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-[#222222] bg-[#121212] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]">
              <Icons.Search size={14} />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search question, keyword, or note..."
              className="w-full bg-[#181818] border border-[#2B2B2B] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-white"
              >
                <Icons.Close size={12} />
              </button>
            )}
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSubject('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSubject === 'all'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#181818] text-[#A1A1AA] hover:text-white border border-[#262626]'
              }`}
            >
              All ({bookmarks.length})
            </button>
            {availableSubjects.map((sub) => {
              const count = bookmarks.filter((b) => String(b.subject_id) === sub.id).length
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedSubject === sub.id
                      ? 'bg-white text-black font-bold'
                      : 'bg-[#181818] text-[#A1A1AA] hover:text-white border border-[#262626]'
                  }`}
                >
                  {sub.name} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin mx-auto"></div>
              <p className="text-xs text-[#A1A1AA]">Loading your saved bookmarks...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-400 text-xs">
              {error}
            </div>
          ) : filteredBookmarks.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center mx-auto text-[#71717A]">
                <Icons.Bookmark size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  {searchQuery || selectedSubject !== 'all'
                    ? 'No bookmarks match your filter'
                    : 'No Bookmarked Questions Yet'}
                </h3>
                <p className="text-xs text-[#71717A] max-w-sm mx-auto mt-1">
                  {searchQuery || selectedSubject !== 'all'
                    ? 'Try clearing the search or changing the subject filter.'
                    : 'During any test or practice session, click the Bookmark (★) button on questions you want to review later.'}
                </p>
              </div>
            </div>
          ) : (
            filteredBookmarks.map((b, index) => {
              const isSolutionOpen = expandedSolutions[b.question_id]
              const isEditingNote = editingNoteId === b.question_id

              return (
                <div
                  key={b.question_id}
                  className="bg-[#181818] border border-[#262626] rounded-2xl p-5 hover:border-[#383838] transition-all space-y-4"
                >
                  {/* Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-white text-black font-mono font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {b.subject_name}
                      </span>
                      {b.topic_name && (
                        <>
                          <span className="text-[#3A3A3A]">•</span>
                          <span className="text-xs text-[#A1A1AA]">{b.topic_name}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                          b.difficulty === 'easy'
                            ? 'bg-[#142018] border-emerald-900/60 text-emerald-400'
                            : b.difficulty === 'hard'
                            ? 'bg-[#261515] border-rose-900/60 text-rose-400'
                            : 'bg-[#221C14] border-amber-900/60 text-amber-400'
                        }`}
                      >
                        {b.difficulty}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveBookmark(b.question_id)}
                        title="Remove Bookmark"
                        className="p-1.5 rounded-lg bg-[#222222] hover:bg-rose-950/50 hover:text-rose-400 text-[#A1A1AA] border border-[#303030] transition-colors cursor-pointer"
                      >
                        <Icons.BookmarkFilled size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="space-y-2">
                    {(langMode === 'both' || langMode === 'en') && b.question_text && (
                      <div className="text-sm font-semibold text-white leading-relaxed">
                        {b.question_text}
                      </div>
                    )}
                    {(langMode === 'both' || langMode === 'hi') &&
                      (b.question_text_hi || (langMode === 'hi' && b.question_text)) && (
                        <div
                          className={`text-sm leading-relaxed ${
                            langMode === 'both' && b.question_text
                              ? 'pt-1.5 border-t border-[#222222] text-[#D4D4D8]'
                              : 'text-white font-semibold'
                          }`}
                        >
                          {b.question_text_hi || b.question_text}
                        </div>
                      )}
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {b.options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                          opt.is_correct
                            ? 'bg-[#112217] border-emerald-500/50 text-emerald-200'
                            : 'bg-[#141414] border-[#262626] text-[#A1A1AA]'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                            opt.is_correct
                              ? 'bg-emerald-500 text-black'
                              : 'bg-[#222222] text-[#D4D4D8]'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <div className="flex-1 space-y-1">
                          {(langMode === 'both' || langMode === 'en') && opt.text && (
                            <div>{opt.text}</div>
                          )}
                          {(langMode === 'both' || langMode === 'hi') &&
                            (opt.text_hi || (langMode === 'hi' && opt.text)) && (
                              <div
                                className={
                                  langMode === 'both' && opt.text
                                    ? 'text-[11px] text-[#8E8E93]'
                                    : ''
                                }
                              >
                                {opt.text_hi || opt.text}
                              </div>
                            )}
                        </div>
                        {opt.is_correct && (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded shrink-0">
                            Correct
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Explanation Accordion */}
                  {(b.explanation || b.explanation_hi) && (
                    <div>
                      <button
                        type="button"
                        onClick={() => toggleExplanation(b.question_id)}
                        className="text-xs text-[#FAFAFA] font-semibold hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isSolutionOpen ? 'Hide Solution' : 'Show Solution & Explanation (हल देखें)'}</span>
                        <Icons.ChevronRight
                          size={12}
                          className={`transition-transform duration-200 ${
                            isSolutionOpen ? 'rotate-90' : ''
                          }`}
                        />
                      </button>

                      {isSolutionOpen && (
                        <div className="mt-3 p-4 rounded-xl bg-[#141414] border border-[#2B2B2B] text-xs text-[#D4D4D8] space-y-2 leading-relaxed animate-in fade-in">
                          <div className="font-bold text-white uppercase text-[10px] font-mono tracking-wider">
                            Detailed Explanation
                          </div>
                          {(langMode === 'both' || langMode === 'en') && b.explanation && (
                            <p>{b.explanation}</p>
                          )}
                          {(langMode === 'both' || langMode === 'hi') &&
                            (b.explanation_hi || (langMode === 'hi' && b.explanation)) && (
                              <p
                                className={
                                  langMode === 'both' && b.explanation
                                    ? 'pt-2 border-t border-[#222222] text-[#A1A1AA]'
                                    : ''
                                }
                              >
                                {b.explanation_hi || b.explanation}
                              </p>
                            )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Personal Study Note */}
                  <div className="pt-2 border-t border-[#222222] flex flex-col gap-2">
                    {isEditingNote ? (
                      <div className="space-y-2 animate-in fade-in">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Write a personal revision note (e.g. remember formula or edge case)..."
                          className="w-full bg-[#121212] border border-[#333333] rounded-xl p-3 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-white resize-none"
                          rows={2}
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingNoteId(null)}
                            disabled={savingNote}
                            className="px-3 py-1 rounded-lg text-xs text-[#A1A1AA] hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(b.question_id)}
                            disabled={savingNote}
                            className="px-3 py-1 rounded-lg bg-white text-black font-bold text-xs hover:bg-[#E5E5E5] transition-colors"
                          >
                            {savingNote ? 'Saving...' : 'Save Note'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[#71717A] text-[11px] font-mono font-bold">
                            Revision Note:
                          </span>
                          {b.note ? (
                            <span className="text-[#FAFAFA] font-medium bg-[#1F1F1F] px-2.5 py-1 rounded-lg border border-[#2B2B2B]">
                              {b.note}
                            </span>
                          ) : (
                            <span className="text-[#52525B] italic text-[11px]">
                              No note added
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setNoteText(b.note || '')
                            setEditingNoteId(b.question_id)
                          }}
                          className="text-[11px] font-bold text-[#A1A1AA] hover:text-white transition-colors"
                        >
                          {b.note ? 'Edit Note' : '+ Add Note'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
