'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { CardsGridSkeleton } from '@/app/components/Shimmer'

interface ScheduleItem {
  id: number
  topic_id: number
  subject_id: number
  title: string
  start_date: string // YYYY-MM-DD
  end_date: string // YYYY-MM-DD
  duration_days: number
  target_hours: number
  target_questions: number
  status: 'planned' | 'in_progress' | 'completed' | 'delayed'
  color: string
  notes?: string
  completed_at?: string
  created_at?: string
  subject_name: string
  subject_code: string
  topic_name: string
  topic_level: number
  topic_priority?: string
}

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-700/80', ring: 'ring-emerald-500/30' },
  blue: { bg: 'bg-blue-950/70', text: 'text-blue-300', border: 'border-blue-700/80', ring: 'ring-blue-500/30' },
  amber: { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-700/80', ring: 'ring-amber-500/30' },
  violet: { bg: 'bg-violet-950/70', text: 'text-violet-300', border: 'border-violet-700/80', ring: 'ring-violet-500/30' },
  rose: { bg: 'bg-rose-950/70', text: 'text-rose-300', border: 'border-rose-700/80', ring: 'ring-rose-500/30' },
}

export default function TopicSchedulerCalendarPage() {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    planned: 0,
    totalDays: 0,
    targetQuestions: 0,
  })
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Views
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Calendar month navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Form Fields
  const [formSubjectId, setFormSubjectId] = useState<number>(1)
  const [formTopicId, setFormTopicId] = useState<number>(0)
  const [formTitle, setFormTitle] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formTargetHours, setFormTargetHours] = useState<number>(4.0)
  const [formTargetQuestions, setFormTargetQuestions] = useState<number>(50)
  const [formStatus, setFormStatus] = useState<'planned' | 'in_progress' | 'completed'>('planned')
  const [formColor, setFormColor] = useState('emerald')
  const [formNotes, setFormNotes] = useState('')

  // Fetch schedules, subjects, and topics
  const loadData = async () => {
    try {
      setLoading(true)
      const [resSchedules, resSubjects, resTopics] = await Promise.all([
        fetch('/api/admin/schedules').then((r) => r.json()),
        fetch('/api/admin/subjects').then((r) => r.json()),
        fetch('/api/admin/topics').then((r) => r.json()),
      ])

      if (resSchedules.success) {
        setSchedules(resSchedules.schedules || [])
        if (resSchedules.stats) setStats(resSchedules.stats)
      }

      if (resSubjects.success) {
        setSubjects(resSubjects.subjects || [])
        if (resSubjects.subjects.length > 0 && !formSubjectId) {
          setFormSubjectId(resSubjects.subjects[0].id)
        }
      }

      if (resTopics.success) {
        setTopics(resTopics.topics || [])
      }
    } catch (err) {
      console.error('Failed to load scheduler data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Topics available for the selected subject in the modal
  const availableTopicsForForm = useMemo(() => {
    return topics.filter((t) => Number(t.subject_id) === Number(formSubjectId))
  }, [topics, formSubjectId])

  // Auto-calculate duration days for modal
  const calculatedDuration = useMemo(() => {
    if (!formStartDate || !formEndDate) return 1
    const s = new Date(formStartDate)
    const e = new Date(formEndDate)
    if (e < s) return 0
    return Math.max(1, Math.round(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }, [formStartDate, formEndDate])

  // Open Add Modal
  const handleOpenAdd = (presetStartDate?: string) => {
    setEditingSchedule(null)
    const today = presetStartDate || new Date().toISOString().split('T')[0]
    const defaultEnd = new Date(today)
    defaultEnd.setDate(defaultEnd.getDate() + 4) // default 5 days

    setFormSubjectId(subjects[0]?.id || 1)
    setFormStartDate(today)
    setFormEndDate(defaultEnd.toISOString().split('T')[0])
    setFormTitle('')
    setFormTargetHours(4.0)
    setFormTargetQuestions(50)
    setFormStatus('planned')
    setFormColor('emerald')
    setFormNotes('')

    const firstTopic = topics.find((t) => Number(t.subject_id) === Number(subjects[0]?.id || 1))
    setFormTopicId(firstTopic ? firstTopic.id : 0)

    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (sch: ScheduleItem) => {
    setEditingSchedule(sch)
    setFormSubjectId(sch.subject_id)
    setFormTopicId(sch.topic_id)
    setFormTitle(sch.title)
    setFormStartDate(sch.start_date)
    setFormEndDate(sch.end_date)
    setFormTargetHours(sch.target_hours)
    setFormTargetQuestions(sch.target_questions)
    setFormStatus(sch.status === 'delayed' ? 'planned' : sch.status)
    setFormColor(sch.color || 'emerald')
    setFormNotes(sch.notes || '')
    setIsModalOpen(true)
  }

  // Date range presets (e.g. 3 Days, 5 Days, 1 Week, 2 Weeks)
  const applyDatePreset = (daysCount: number) => {
    const s = formStartDate ? new Date(formStartDate) : new Date()
    const e = new Date(s)
    e.setDate(e.getDate() + (daysCount - 1))
    setFormEndDate(e.toISOString().split('T')[0])
  }

  // Save Schedule (Create / Update)
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTopicId) return alert('Please select a topic.')
    if (!formStartDate || !formEndDate) return alert('Start and End dates are required.')

    try {
      const selectedTopic = topics.find((t) => t.id === Number(formTopicId))
      const scheduleTitle = formTitle.trim() || selectedTopic?.name || 'Scheduled Topic'

      if (editingSchedule) {
        // PUT
        const res = await fetch('/api/admin/schedules', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSchedule.id,
            title: scheduleTitle,
            start_date: formStartDate,
            end_date: formEndDate,
            target_hours: formTargetHours,
            target_questions: formTargetQuestions,
            status: formStatus,
            color: formColor,
            notes: formNotes,
          }),
        })
        const json = await res.json()
        if (json.success) {
          setIsModalOpen(false)
          loadData()
        } else {
          alert(json.error || 'Failed to update schedule')
        }
      } else {
        // POST
        const res = await fetch('/api/admin/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic_id: formTopicId,
            subject_id: formSubjectId,
            title: scheduleTitle,
            start_date: formStartDate,
            end_date: formEndDate,
            target_hours: formTargetHours,
            target_questions: formTargetQuestions,
            status: formStatus,
            color: formColor,
            notes: formNotes,
          }),
        })
        const json = await res.json()
        if (json.success) {
          setIsModalOpen(false)
          loadData()
        } else {
          alert(json.error || 'Failed to create schedule')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Error saving topic schedule')
    }
  }

  // Toggle quick status (Planned -> In Progress -> Completed)
  const handleToggleStatus = async (sch: ScheduleItem) => {
    const nextStatus = sch.status === 'planned' ? 'in_progress' : sch.status === 'in_progress' ? 'completed' : 'planned'
    try {
      await fetch('/api/admin/schedules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: sch.id,
          status: nextStatus,
        }),
      })
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  // Delete Schedule
  const handleDeleteSchedule = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/schedules?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteConfirmId(null)
        loadData()
      } else {
        alert(json.error || 'Failed to delete schedule')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return schedules.filter((sch) => {
      if (selectedSubjectFilter !== 'all' && String(sch.subject_id) !== selectedSubjectFilter) {
        return false
      }
      if (statusFilter !== 'all' && sch.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const match =
          sch.title?.toLowerCase().includes(q) ||
          sch.topic_name?.toLowerCase().includes(q) ||
          sch.subject_name?.toLowerCase().includes(q) ||
          sch.notes?.toLowerCase().includes(q)
        if (!match) return false
      }
      return true
    })
  }, [schedules, selectedSubjectFilter, statusFilter, searchQuery])

  // Calendar Month Grid Calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() // 0-indexed

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sunday, 1 = Monday...
  // Normalize to Monday = 0
  const mondayFirstOffset = (firstDayIndex + 6) % 7

  const prevMonthDays = new Date(year, month, 0).getDate()

  // Calendar dates matrix
  const calendarCells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = []

  // Preceding month filler days
  for (let i = mondayFirstOffset - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const prevDate = new Date(year, month - 1, day)
    calendarCells.push({
      dateStr: prevDate.toISOString().split('T')[0],
      dayNumber: day,
      isCurrentMonth: false,
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(month + 1).padStart(2, '0')
    const dStr = String(day).padStart(2, '0')
    calendarCells.push({
      dateStr: `${year}-${mStr}-${dStr}`,
      dayNumber: day,
      isCurrentMonth: true,
    })
  }

  // Next month filler days (to make full grid of 35 or 42)
  const remaining = (7 - (calendarCells.length % 7)) % 7
  for (let day = 1; day <= remaining; day++) {
    const nextDate = new Date(year, month + 1, day)
    calendarCells.push({
      dateStr: nextDate.toISOString().split('T')[0],
      dayNumber: day,
      isCurrentMonth: false,
    })
  }

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-[#111111] border border-[#262626] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase bg-[#161616] text-[#A1A1AA] border border-[#262626] mb-2">
            <span>📅 Advance Topic Study Scheduler</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
            Study Schedule & Topic Calendar
          </h1>
          <p className="text-xs md:text-sm text-[#71717A] mt-1 max-w-xl leading-relaxed">
            Plan, schedule, and allocate days to any topic across Computer Knowledge, Reasoning, Math, and GK with start-to-end deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-[#161616] border border-[#262626]">
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-white text-black'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Icons.Calendar size={13} />
              <span>Month Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white text-black'
                  : 'text-[#A1A1AA] hover:text-white'
              }`}
            >
              <Icons.ListFilter size={13} />
              <span>Timeline List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAdd()}
            className="px-4 py-2 rounded-xl bg-white text-black hover:bg-[#E4E4E7] text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Icons.Plus size={14} />
            <span>Schedule Topic</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (5 KPI summary) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
          <span className="text-[10px] font-mono uppercase font-bold text-[#71717A] block">
            Scheduled Topics
          </span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {stats.total}
          </div>
          <span className="text-[10px] text-[#A1A1AA]">Study Milestones</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
          <span className="text-[10px] font-mono uppercase font-bold text-amber-400 block flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            In Progress
          </span>
          <div className="text-2xl font-black font-mono text-amber-300 mt-1">
            {stats.inProgress}
          </div>
          <span className="text-[10px] text-[#A1A1AA]">Active Study Topics</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
          <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block">
            Completed
          </span>
          <div className="text-2xl font-black font-mono text-emerald-300 mt-1">
            {stats.completed}
          </div>
          <span className="text-[10px] text-[#A1A1AA]">Syllabus Cleared</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
          <span className="text-[10px] font-mono uppercase font-bold text-[#A1A1AA] block">
            Planned Days
          </span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {stats.totalDays} Days
          </div>
          <span className="text-[10px] text-[#A1A1AA]">Duration Allocated</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#111111] border border-[#262626]">
          <span className="text-[10px] font-mono uppercase font-bold text-[#A1A1AA] block">
            Target Questions
          </span>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {stats.targetQuestions} MCQs
          </div>
          <span className="text-[10px] text-[#A1A1AA]">Practice Goal</span>
        </div>
      </div>

      {/* 3. Toolbar: Subject Filters & Search */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Icons.Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]"
            />
            <input
              type="text"
              placeholder="Search scheduled topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          {/* Subject Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedSubjectFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                selectedSubjectFilter === 'all'
                  ? 'bg-white text-black font-bold'
                  : 'bg-[#151515] text-[#A1A1AA] border border-[#262626] hover:text-white'
              }`}
            >
              All Subjects ({schedules.length})
            </button>
            {subjects.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectFilter(String(sub.id))}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors shrink-0 cursor-pointer ${
                  selectedSubjectFilter === String(sub.id)
                    ? 'bg-white text-black font-bold'
                    : 'bg-[#151515] text-[#A1A1AA] border border-[#262626] hover:text-white'
                }`}
              >
                {sub.code}: {sub.name}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 shrink-0 justify-end">
          {(['all', 'in_progress', 'planned', 'completed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase font-bold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#202020] text-white border border-[#444444]'
                  : 'text-[#71717A] hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Status' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Main View: Calendar Month Grid OR Timeline List */}
      {viewMode === 'calendar' ? (
        <div className="bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden shadow-xs">
          {/* Calendar Header with Month Navigation */}
          <div className="p-4 bg-[#141414] border-b border-[#262626] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                {monthNames[month]} {year}
              </h2>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date())}
                className="px-2.5 py-1 rounded-lg bg-[#1D1D1D] border border-[#2E2E2E] text-[11px] font-mono text-[#D4D4D8] hover:text-white hover:bg-[#262626] transition-colors cursor-pointer"
              >
                Today
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] border border-[#2B2B2B] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Previous Month"
              >
                <Icons.ChevronRight size={14} className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] border border-[#2B2B2B] text-[#A1A1AA] hover:text-white transition-colors cursor-pointer"
                title="Next Month"
              >
                <Icons.ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 border-b border-[#262626] bg-[#121212] text-center text-[10px] font-mono uppercase font-bold text-[#71717A] py-2.5">
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div className="text-amber-400/80">Sat</div>
            <div className="text-rose-400/80">Sun</div>
          </div>

          {/* Month Day Cells Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[#1F1F1F] bg-[#0E0E0E]">
            {calendarCells.map((cell, idx) => {
              const isToday = cell.dateStr === todayStr

              // Find schedules active on this date (start_date <= cell.dateStr <= end_date)
              const activeSchedulesOnDay = filteredSchedules.filter((sch) => {
                return sch.start_date <= cell.dateStr && cell.dateStr <= sch.end_date
              })

              return (
                <div
                  key={idx}
                  className={`min-h-[110px] sm:min-h-[130px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors group ${
                    cell.isCurrentMonth ? 'bg-[#0E0E0E]' : 'bg-[#0A0A0A] opacity-45'
                  } ${isToday ? 'ring-1 ring-white/30 bg-[#141414]' : ''}`}
                >
                  {/* Top Day Header */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-mono font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-white text-black'
                          : cell.isCurrentMonth
                          ? 'text-[#FAFAFA]'
                          : 'text-[#52525B]'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>

                    {/* Quick "+" button on hover to schedule on this date */}
                    <button
                      type="button"
                      onClick={() => handleOpenAdd(cell.dateStr)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[#71717A] hover:text-white hover:bg-[#202020] transition-opacity cursor-pointer text-[10px]"
                      title={`Schedule topic starting ${cell.dateStr}`}
                    >
                      +
                    </button>
                  </div>

                  {/* Topic Bars on this Day */}
                  <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px] scrollbar-none">
                    {activeSchedulesOnDay.map((sch) => {
                      const colorStyle = COLOR_MAP[sch.color] || COLOR_MAP.emerald
                      const isStart = sch.start_date === cell.dateStr
                      const isEnd = sch.end_date === cell.dateStr

                      return (
                        <div
                          key={sch.id}
                          onClick={() => handleOpenEdit(sch)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium border truncate cursor-pointer transition-all hover:scale-[1.02] shadow-2xs ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} ${
                            isStart ? 'font-bold' : ''
                          }`}
                          title={`${sch.title} (${sch.start_date} to ${sch.end_date}, ${sch.duration_days} days) - Click to edit`}
                        >
                          <span className="font-mono text-[9px] mr-1 opacity-70">
                            {sch.subject_code}
                          </span>
                          <span>{sch.title}</span>
                          {isEnd && <span className="ml-1 text-[8px] opacity-75">🏁</span>}
                        </div>
                      )
                    })}
                  </div>

                  {/* Bottom Day Indicator */}
                  {activeSchedulesOnDay.length > 0 && (
                    <div className="text-[9px] font-mono text-[#71717A] text-right mt-1 pt-0.5 border-t border-[#1C1C1C]">
                      {activeSchedulesOnDay.length} {activeSchedulesOnDay.length === 1 ? 'Topic' : 'Topics'}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* 5. Timeline / Schedule List View */
        <div className="bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden">
          <div className="p-4 bg-[#141414] border-b border-[#262626] flex items-center justify-between text-xs font-mono text-[#71717A]">
            <span>SCHEDULED TOPICS TIMELINE</span>
            <span>{filteredSchedules.length} Active Records</span>
          </div>

          {loading ? (
            <div className="p-4"><CardsGridSkeleton count={4} /></div>
          ) : filteredSchedules.length === 0 ? (
            <div className="py-16 text-center text-xs text-[#71717A] space-y-2">
              <div className="text-3xl">📅</div>
              <div className="text-sm font-semibold text-white">No Scheduled Topics Found</div>
              <p className="max-w-xs mx-auto text-[#71717A]">
                Click &quot;Schedule Topic&quot; to plan your first study timeline.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1F1F1F]">
              {filteredSchedules.map((sch) => {
                const colorStyle = COLOR_MAP[sch.color] || COLOR_MAP.emerald

                return (
                  <div
                    key={sch.id}
                    className="p-4 hover:bg-[#151515] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    {/* Left Details */}
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase border ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border}`}>
                          {sch.subject_code}
                        </span>
                        <span className="font-bold text-white text-sm">
                          {sch.title}
                        </span>
                        {sch.title !== sch.topic_name && (
                          <span className="text-[11px] text-[#71717A] font-mono">
                            ({sch.topic_name})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-mono text-[#A1A1AA] pt-1">
                        <span>
                          📅 <strong>{sch.start_date}</strong> ➔ <strong>{sch.end_date}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-bold text-white">
                          ⏳ {sch.duration_days} {sch.duration_days === 1 ? 'Day' : 'Days'}
                        </span>
                        <span>•</span>
                        <span>🎯 {sch.target_questions} MCQs</span>
                        <span>•</span>
                        <span>⏱️ {sch.target_hours} hrs/day</span>
                      </div>

                      {sch.notes && (
                        <p className="text-[11px] text-[#71717A] italic mt-0.5">
                          &quot;{sch.notes}&quot;
                        </p>
                      )}
                    </div>

                    {/* Right Actions & Status */}
                    <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#202020]">
                      {/* Status Toggle Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(sch)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                          sch.status === 'completed'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                            : sch.status === 'in_progress'
                            ? 'bg-amber-950/80 text-amber-300 border-amber-700'
                            : 'bg-[#181818] text-[#A1A1AA] border-[#2E2E2E] hover:text-white'
                        }`}
                        title="Click to advance status (Planned ➔ In Progress ➔ Completed)"
                      >
                        {sch.status === 'completed'
                          ? '✓ COMPLETED'
                          : sch.status === 'in_progress'
                          ? '⚡ IN PROGRESS'
                          : '⏳ PLANNED'}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sch)}
                        className="p-1.5 rounded-lg text-[#71717A] hover:text-white hover:bg-[#202020] border border-transparent hover:border-[#333333] transition-colors cursor-pointer"
                        title="Edit Schedule Details"
                      >
                        <Icons.Edit size={14} />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(sch.id)}
                        className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Delete Schedule"
                      >
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Schedule / Edit Topic Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Topic Schedule' : 'Schedule Topic Timeline'}
        subtitle="Allocate start-to-end dates, study duration in days, and daily practice goals"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveSchedule} className="space-y-4 text-xs">
          {/* Subject Picker */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Select Subject *
            </label>
            <select
              value={formSubjectId}
              onChange={(e) => {
                const subId = Number(e.target.value)
                setFormSubjectId(subId)
                const firstT = topics.find((t) => Number(t.subject_id) === subId)
                setFormTopicId(firstT ? firstT.id : 0)
              }}
              disabled={Boolean(editingSchedule)}
              className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs font-semibold focus:outline-none focus:border-[#52525B] cursor-pointer disabled:opacity-50"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code}: {sub.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Picker */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Select Topic from Syllabus *
            </label>
            <select
              value={formTopicId}
              onChange={(e) => {
                const tId = Number(e.target.value)
                setFormTopicId(tId)
                const selTopic = topics.find((t) => t.id === tId)
                if (selTopic && !formTitle) {
                  setFormTitle(selTopic.name)
                }
              }}
              disabled={Boolean(editingSchedule)}
              className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] cursor-pointer disabled:opacity-50"
            >
              {availableTopicsForForm.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.level === 1 ? `📌 [Main Module] ${t.name}` : `   └─ ${t.name}`}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Title (Optional override) */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Custom Schedule Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. C Programming Loops & Functions Intensive"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          {/* Date Range: Start to End */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-[#141414] border border-[#262626]">
            <div>
              <label className="block text-[11px] font-mono font-bold text-white uppercase mb-1">
                Start Date (प्रारंभ तिथि) *
              </label>
              <input
                type="date"
                required
                value={formStartDate}
                onChange={(e) => setFormStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#2E2E2E] bg-[#181818] text-white text-xs font-mono focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-bold text-white uppercase mb-1">
                End Date (समाप्ति तिथि) *
              </label>
              <input
                type="date"
                required
                value={formEndDate}
                onChange={(e) => setFormEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#2E2E2E] bg-[#181818] text-white text-xs font-mono focus:outline-none focus:border-white"
              />
            </div>

            {/* Quick Duration Presets */}
            <div className="sm:col-span-2 pt-2 border-t border-[#222222] flex items-center justify-between flex-wrap gap-2">
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                ⚡ Duration: {calculatedDuration} {calculatedDuration === 1 ? 'Day' : 'Days'}
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#71717A] font-mono">Quick Presets:</span>
                {[
                  { label: '3 Days', count: 3 },
                  { label: '5 Days', count: 5 },
                  { label: '1 Week', count: 7 },
                  { label: '2 Weeks', count: 14 },
                ].map((pre) => (
                  <button
                    key={pre.count}
                    type="button"
                    onClick={() => applyDatePreset(pre.count)}
                    className="px-2 py-0.5 rounded-lg bg-[#202020] hover:bg-[#2A2A2A] border border-[#333333] text-[10px] font-mono text-[#D4D4D8] cursor-pointer"
                  >
                    {pre.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Goals: Hours and Questions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Target Hours / Day
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                value={formTargetHours}
                onChange={(e) => setFormTargetHours(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs font-mono focus:outline-none focus:border-[#52525B]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Total Target MCQs
              </label>
              <input
                type="number"
                min="5"
                max="1000"
                value={formTargetQuestions}
                onChange={(e) => setFormTargetQuestions(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs font-mono focus:outline-none focus:border-[#52525B]"
              />
            </div>
          </div>

          {/* Status & Color Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Initial Status
              </label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs font-semibold focus:outline-none focus:border-[#52525B] cursor-pointer"
              >
                <option value="planned">⏳ Planned (नियोजित)</option>
                <option value="in_progress">⚡ In Progress (प्रगति पर)</option>
                <option value="completed">✓ Completed (पूर्ण)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Badge Color
              </label>
              <select
                value={formColor}
                onChange={(e) => setFormColor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs font-semibold focus:outline-none focus:border-[#52525B] cursor-pointer"
              >
                <option value="emerald">🟢 Emerald Green</option>
                <option value="blue">🔵 Sapphire Blue</option>
                <option value="amber">🟡 Amber Gold</option>
                <option value="violet">🟣 Royal Violet</option>
                <option value="rose">🔴 Coral Rose</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Study Notes / Milestones
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="e.g. Focus on binary conversions, solve previous paper 2023 questions..."
              className="w-full px-3.5 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] text-white font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-black hover:bg-[#E4E4E7] font-bold shadow-xs cursor-pointer"
            >
              {editingSchedule ? 'Update Schedule' : 'Confirm & Schedule Topic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Remove Scheduled Topic"
        subtitle="Confirm removal of this study timeline entry"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[#A1A1AA]">
            Are you sure you want to remove this topic from your study calendar? This will remove the allocated dates and timeline entry.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#262626]">
            <button
              type="button"
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] border border-[#2E2E2E] text-white font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => deleteConfirmId && handleDeleteSchedule(deleteConfirmId)}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold cursor-pointer"
            >
              Delete Schedule
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
