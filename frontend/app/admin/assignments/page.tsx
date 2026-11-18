'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Icons } from '@/components/admin/Icons'
import Modal from '@/components/admin/Modal'
import { toast } from 'sonner'

interface Student {
  id: number
  full_name: string
  username: string
  email: string
  account_status: string
}

interface MockTest {
  id: number
  title: string
  assessment_type: string
  total_questions: number
  duration_minutes: number
  difficulty_level: string
  status: string
}

interface Assignment {
  id: number
  student_id: number
  mock_test_id: number
  assignment_status: string
  assigned_at: string
  revoked_at?: string
  student_name: string
  student_email: string
  student_username: string
  student_status: string
  mock_test_title: string
  mock_test_slug: string
  total_questions: number
  duration_minutes: number
  subject_name?: string
  assigned_by_name?: string
  latest_attempt_status?: string
  latest_score?: number
}

export default function MockTestAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [mockTests, setMockTests] = useState<MockTest[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'assigned' | 'revoked' | 'completed'>('all')
  const [filterTestId, setFilterTestId] = useState<string>('all')
  const [filterStudentId, setFilterStudentId] = useState<string>('all')

  // Modal for new bulk/individual assignment
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [selectedTestIds, setSelectedTestIds] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true)
      const [resAssign, resStudents, resTests] = await Promise.all([
        fetch('/api/admin/assignments').then((r) => r.json()),
        fetch('/api/admin/students').then((r) => r.json()),
        fetch('/api/admin/mock-tests').then((r) => r.json()),
      ])

      if (resAssign.success) setAssignments(resAssign.assignments || [])
      if (resStudents.success) setStudents(resStudents.students || [])
      if (resTests.success) setMockTests(resTests.tests || [])
    } catch (err) {
      console.error('Failed to load assignments:', err)
      toast.error('Failed to load mock test assignments data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (statusFilter !== 'all' && a.assignment_status !== statusFilter) return false
      if (filterTestId !== 'all' && String(a.mock_test_id) !== filterTestId) return false
      if (filterStudentId !== 'all' && String(a.student_id) !== filterStudentId) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchStudent =
          a.student_name.toLowerCase().includes(q) ||
          a.student_email.toLowerCase().includes(q) ||
          a.student_username.toLowerCase().includes(q)
        const matchTest = a.mock_test_title.toLowerCase().includes(q)
        if (!matchStudent && !matchTest) return false
      }

      return true
    })
  }, [assignments, statusFilter, filterTestId, filterStudentId, searchQuery])

  // Handle assign submission
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedStudentIds.length === 0 || selectedTestIds.length === 0) {
      toast.error('Please select at least one student and one mock test.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_ids: selectedStudentIds,
          mock_test_ids: selectedTestIds,
        }),
      })
      const data = await res.json()

      if (data.success) {
        toast.success(data.message || 'Mock tests assigned successfully!')
        setShowAssignModal(false)
        setSelectedStudentIds([])
        setSelectedTestIds([])
        fetchData()
      } else {
        toast.error(data.error || 'Failed to assign mock tests')
      }
    } catch {
      toast.error('Error assigning tests')
    } finally {
      setSubmitting(false)
    }
  }

  // Revoke an assignment
  const handleRevokeAssignment = async (id: number, studentName: string, testTitle: string) => {
    if (!confirm(`Revoke access to "${testTitle}" for student "${studentName}"?`)) return

    try {
      const res = await fetch(`/api/admin/assignments?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Assignment access revoked immediately')
        fetchData()
      } else {
        toast.error(data.error || 'Failed to revoke assignment')
      }
    } catch {
      toast.error('Error revoking assignment')
    }
  }

  // Reactivate / Restore an assignment
  const handleReactivateAssignment = async (id: number) => {
    try {
      const res = await fetch('/api/admin/assignments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, assignment_status: 'assigned' }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Assignment restored to active')
        fetchData()
      } else {
        toast.error(data.error || 'Failed to update assignment')
      }
    } catch {
      toast.error('Error updating assignment')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
            <Icons.Assignments className="text-white" size={24} />
            Mock Test Assignments
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1">
            Grant or revoke student-specific permissions to view and attempt mock tests.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedStudentIds([])
            setSelectedTestIds([])
            setShowAssignModal(true)
          }}
          className="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <Icons.Plus size={16} />
          Assign Mock Tests
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-4">
          <span className="text-xs text-[#737373] uppercase tracking-wider font-mono">Total Assignments</span>
          <p className="text-2xl font-bold text-[#FAFAFA] mt-1">{assignments.length}</p>
        </div>
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-4">
          <span className="text-xs text-[#737373] uppercase tracking-wider font-mono">Active (Assigned)</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {assignments.filter((a) => a.assignment_status === 'assigned').length}
          </p>
        </div>
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-4">
          <span className="text-xs text-[#737373] uppercase tracking-wider font-mono">Completed</span>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {assignments.filter((a) => a.assignment_status === 'completed').length}
          </p>
        </div>
        <div className="bg-[#121212] border border-[#262626] rounded-xl p-4">
          <span className="text-xs text-[#737373] uppercase tracking-wider font-mono">Revoked</span>
          <p className="text-2xl font-bold text-red-400 mt-1">
            {assignments.filter((a) => a.assignment_status === 'revoked').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Icons.Search className="absolute left-3 top-2.5 text-[#737373]" size={16} />
            <input
              type="text"
              placeholder="Search by student name, username, email or test title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-[#262626] rounded-lg pl-9 pr-3 py-2 text-xs text-[#FAFAFA] placeholder-[#737373] focus:outline-none focus:border-white transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-white"
            >
              <option value="all">All Statuses</option>
              <option value="assigned">Active (Assigned)</option>
              <option value="completed">Completed</option>
              <option value="revoked">Revoked</option>
            </select>

            {/* Test Filter */}
            <select
              value={filterTestId}
              onChange={(e) => setFilterTestId(e.target.value)}
              className="bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-white max-w-[180px] truncate"
            >
              <option value="all">All Mock Tests</option>
              {mockTests.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>

            {/* Student Filter */}
            <select
              value={filterStudentId}
              onChange={(e) => setFilterStudentId(e.target.value)}
              className="bg-[#1A1A1A] border border-[#262626] rounded-lg px-3 py-2 text-xs text-[#FAFAFA] focus:outline-none focus:border-white max-w-[180px] truncate"
            >
              <option value="all">All Students</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} (@{s.username})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Table */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171717] text-[#A3A3A3] border-b border-[#262626]">
              <tr>
                <th className="py-3 px-4 font-semibold">Student</th>
                <th className="py-3 px-4 font-semibold">Mock Test</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Attempt & Score</th>
                <th className="py-3 px-4 font-semibold">Assigned Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#737373]">
                    Loading assignments...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#737373]">
                    No mock test assignments found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-[#171717]/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#FAFAFA]">{a.student_name}</div>
                      <div className="text-[11px] text-[#737373] font-mono">
                        @{a.student_username} • {a.student_email}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#FAFAFA] line-clamp-1">{a.mock_test_title}</div>
                      <div className="text-[11px] text-[#737373]">
                        {a.total_questions} questions • {a.duration_minutes} mins
                        {a.subject_name && ` • ${a.subject_name}`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          a.assignment_status === 'assigned'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : a.assignment_status === 'completed'
                            ? 'bg-blue-950/60 text-blue-400 border border-blue-800'
                            : 'bg-red-950/60 text-red-400 border border-red-800'
                        }`}
                      >
                        {a.assignment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3]">
                      {a.latest_attempt_status ? (
                        <div>
                          <span className="capitalize">{a.latest_attempt_status}</span>
                          {a.latest_score !== undefined && a.latest_score !== null && (
                            <span className="font-bold text-white ml-1.5">({a.latest_score}%)</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#737373]">Not attempted</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#737373] text-[11px]">
                      {new Date(a.assigned_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {a.assignment_status === 'assigned' ? (
                        <button
                          onClick={() => handleRevokeAssignment(a.id, a.student_name, a.mock_test_title)}
                          className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivateAssignment(a.id)}
                          className="px-2.5 py-1 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Reassign
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal (Select Multiple Students & Multiple Mock Tests) */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Mock Tests to Students"
        maxWidth="lg"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <p className="text-xs text-[#A3A3A3]">
            Select one or multiple students and mock tests. Each selected student will receive an active assignment for each selected mock test.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student selection panel */}
            <div className="border border-[#262626] rounded-xl p-3 bg-[#171717] flex flex-col h-72">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <span className="text-xs font-bold text-[#FAFAFA]">Select Students ({selectedStudentIds.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStudentIds.length === students.length) {
                      setSelectedStudentIds([])
                    } else {
                      setSelectedStudentIds(students.map((s) => s.id))
                    }
                  }}
                  className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  {selectedStudentIds.length === students.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 py-2 custom-scrollbar">
                {students.map((s) => {
                  const checked = selectedStudentIds.includes(s.id)
                  return (
                    <label
                      key={s.id}
                      className={`flex items-center gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        checked ? 'bg-[#262626] text-white' : 'hover:bg-[#1E1E1E] text-[#A3A3A3]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentIds([...selectedStudentIds, s.id])
                          } else {
                            setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id))
                          }
                        }}
                        className="rounded border-[#404040]"
                      />
                      <div className="truncate">
                        <span className="font-semibold text-white">{s.full_name}</span>
                        <span className="text-[10px] text-[#737373] ml-1.5">(@{s.username})</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Mock Test selection panel */}
            <div className="border border-[#262626] rounded-xl p-3 bg-[#171717] flex flex-col h-72">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <span className="text-xs font-bold text-[#FAFAFA]">Select Mock Tests ({selectedTestIds.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTestIds.length === mockTests.length) {
                      setSelectedTestIds([])
                    } else {
                      setSelectedTestIds(mockTests.map((t) => t.id))
                    }
                  }}
                  className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                >
                  {selectedTestIds.length === mockTests.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 py-2 custom-scrollbar">
                {mockTests.map((t) => {
                  const checked = selectedTestIds.includes(t.id)
                  return (
                    <label
                      key={t.id}
                      className={`flex items-start gap-2 p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                        checked ? 'bg-[#262626] text-white' : 'hover:bg-[#1E1E1E] text-[#A3A3A3]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTestIds([...selectedTestIds, t.id])
                          } else {
                            setSelectedTestIds(selectedTestIds.filter((id) => id !== t.id))
                          }
                        }}
                        className="mt-0.5 rounded border-[#404040]"
                      />
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{t.title}</div>
                        <div className="text-[10px] text-[#737373]">
                          {t.total_questions} Qs • {t.duration_minutes}m • {t.difficulty_level}
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#262626]">
            <span className="text-xs text-[#737373]">
              Assigning {selectedTestIds.length} test(s) to {selectedStudentIds.length} student(s) (
              {selectedStudentIds.length * selectedTestIds.length} total operations)
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-3 py-1.5 rounded-lg border border-[#333] hover:bg-[#222] text-xs font-semibold text-[#A3A3A3] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || selectedStudentIds.length === 0 || selectedTestIds.length === 0}
                className="px-4 py-1.5 rounded-lg bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
