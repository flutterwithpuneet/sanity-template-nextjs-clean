'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { TableSkeleton } from '@/app/components/Shimmer'
import { toast } from 'sonner'

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [includeDeleted, setIncludeDeleted] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<any>(null)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    mobile: '',
    state: 'Rajasthan',
    district: 'Jaipur',
    account_status: 'active',
  })

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (includeDeleted) params.append('include_deleted', 'true')

      const res = await fetch(`/api/admin/students?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setStudents(json.students)
      } else {
        toast.error(json.error || 'Failed to load students')
      }
    } catch (err) {
      console.error(err)
      toast.error('Network error fetching students')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [statusFilter, includeDeleted])

  const handleOpenAdd = () => {
    setEditingStudent(null)
    setForm({
      full_name: '',
      email: '',
      username: '',
      password: '',
      mobile: '',
      state: 'Rajasthan',
      district: 'Jaipur',
      account_status: 'active',
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (st: any) => {
    setEditingStudent(st)
    setForm({
      full_name: st.full_name,
      email: st.email,
      username: st.username,
      password: '',
      mobile: st.mobile || '',
      state: st.state || 'Rajasthan',
      district: st.district || 'Jaipur',
      account_status: st.account_status || 'active',
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email) return toast.error('Name and email are required')

    try {
      const method = editingStudent ? 'PUT' : 'POST'
      const payload = editingStudent ? { ...form, id: editingStudent.id } : form

      const res = await fetch('/api/admin/students', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editingStudent ? 'Student updated successfully' : 'Candidate registered successfully')
        setModalOpen(false)
        fetchStudents()
      } else {
        toast.error(json.error || 'Failed to save student')
      }
    } catch {
      toast.error('Error saving student')
    }
  }

  // Deletion: Soft delete + revoke sessions + revoke test assignments immediately
  const handleDelete = async () => {
    if (!deleteConfirmStudent) return
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/students?id=${deleteConfirmStudent.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        toast.success('Student deleted and all sessions/assignments revoked immediately')
        setDeleteConfirmStudent(null)
        fetchStudents()
      } else {
        toast.error(json.error || 'Failed to delete student')
      }
    } catch {
      toast.error('Error deleting student')
    } finally {
      setDeleting(false)
    }
  }

  // Reactivate student account
  const handleReactivate = async (studentId: number) => {
    try {
      const res = await fetch('/api/admin/students/reactivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: studentId }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Student account reactivated successfully!')
        fetchStudents()
      } else {
        toast.error(json.error || 'Failed to reactivate student')
      }
    } catch {
      toast.error('Error reactivating student')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Student Management</h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Student account lifecycle, test access permissions, and session authorization control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/assignments"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C1C1C] hover:bg-[#252525] text-white border border-[#333] text-xs font-semibold transition-colors"
          >
            <Icons.Assignments size={15} />
            <span>Manage Assignments</span>
          </Link>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Icons.Plus size={15} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Icons.Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            placeholder="Search candidate name, username, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
            <option value="deleted">Deleted</option>
          </select>

          <label className="flex items-center gap-1.5 text-xs text-[#A3A3A3] cursor-pointer">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="rounded border-[#404040]"
            />
            <span>Include Deactivated</span>
          </label>

          <div className="text-xs font-mono font-medium text-[#71717A] whitespace-nowrap pl-2">
            {students.length} Students
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden">
        {loading ? (
          <TableSkeleton cols={7} rows={5} />
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#71717A]">No candidates found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151515] border-b border-[#262626] text-[10px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Assigned Tests</th>
                  <th className="py-3 px-4 text-center">Tests Taken</th>
                  <th className="py-3 px-4 text-center">Avg Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F] text-xs text-[#FAFAFA]">
                {students.map((st) => {
                  const isDeleted = st.account_status === 'deleted' || Boolean(st.deleted_at)

                  return (
                    <tr key={st.id} className="hover:bg-[#151515]/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#191919] border border-[#3F3F46] text-[#FAFAFA] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                            {st.full_name ? st.full_name.charAt(0).toUpperCase() : 'C'}
                          </div>
                          <div>
                            <div className="font-semibold text-[#FAFAFA] flex items-center gap-1.5">
                              {st.full_name}
                              {isDeleted && (
                                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-red-950 text-red-400 border border-red-900 font-mono">
                                  Deleted
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#71717A] font-mono">
                              @{st.username} • {st.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[#A1A1AA]">{st.district || 'Jaipur'}, {st.state || 'Rajasthan'}</div>
                        <div className="text-[10px] text-[#71717A] font-mono">{st.mobile || 'No Mobile'}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link
                          href={`/admin/assignments?student_id=${st.id}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#1C1C1C] hover:bg-[#252525] text-white border border-[#333] font-mono text-[11px] font-bold"
                          title="Click to view or edit assignments"
                        >
                          <Icons.Assignments size={12} />
                          <span>{st.assigned_tests_count || 0}</span>
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-[#FAFAFA]">
                        {st.attempts_count || 0}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-[#FAFAFA]">
                        {st.avg_score ? `${Number(st.avg_score).toFixed(0)}%` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                            isDeleted
                              ? 'bg-red-950/60 text-red-400 border border-red-800'
                              : st.account_status === 'active'
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                              : 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          }`}
                        >
                          {isDeleted ? 'deleted' : st.account_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/assignments?student_id=${st.id}`}
                            className="p-1.5 rounded-lg text-[#A3A3A3] hover:text-white hover:bg-[#202020] transition-colors"
                            title="Assign Tests"
                          >
                            <Icons.Assignments size={14} />
                          </Link>

                          {!isDeleted ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(st)}
                                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors cursor-pointer"
                                title="Edit Profile"
                              >
                                <Icons.Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmStudent(st)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors cursor-pointer"
                                title="Delete & Invalidate Sessions"
                              >
                                <Icons.Trash size={14} />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(st.id)}
                              className="px-2 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStudent ? 'Edit Candidate Profile' : 'Register New Candidate'}
        subtitle="Manage student account credentials and state details"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. Rahul Verma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                disabled={Boolean(editingStudent)}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="e.g. rahul@examforge.in"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B] font-mono disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Username
              </label>
              <input
                type="text"
                disabled={Boolean(editingStudent)}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="e.g. rahul_v"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B] font-mono disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Password {editingStudent ? '(Leave blank to keep unchanged)' : '*'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={editingStudent ? '••••••••' : 'Enter login password'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Mobile Number
              </label>
              <input
                type="text"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="e.g. 9876543210"
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                District / City
              </label>
              <input
                type="text"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                placeholder="e.g. Jaipur, Jodhpur, Kota"
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Account Status
            </label>
            <select
              value={form.account_status}
              onChange={(e) => setForm({ ...form, account_status: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive (Revokes sessions)</option>
              <option value="suspended">Suspended (Revokes sessions)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1F1F1F]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#202020] hover:text-[#FAFAFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
            >
              {editingStudent ? 'Update Candidate' : 'Register Candidate'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete and Access Revocation Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmStudent !== null}
        onClose={() => setDeleteConfirmStudent(null)}
        title="Delete Candidate Account"
        subtitle="Automatic Access Revocation & Session Invalidation"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-950/30 border border-red-900/50 rounded-xl space-y-2">
            <div className="text-xs font-bold text-red-300 flex items-center gap-1.5">
              <span>⚠️ Immediate Security Revocation</span>
            </div>
            <p className="text-xs text-red-200/90 leading-relaxed">
              Deleting <strong>{deleteConfirmStudent?.full_name}</strong> (@{deleteConfirmStudent?.username}) will trigger immediate server-side revocation:
            </p>
            <ul className="text-[11px] text-red-300/80 list-disc list-inside space-y-1">
              <li>Immediately deactivate account and set deleted status</li>
              <li>Invalidate all active authentication tokens and browser sessions</li>
              <li>Immediately block any open browser session on their very next request</li>
              <li>Revoke all assigned mock tests</li>
              <li>Prevent in-progress exam attempts from being submitted</li>
              <li>Reject future login attempts with these credentials</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteConfirmStudent(null)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:bg-[#202020] hover:text-[#FAFAFA] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {deleting ? 'Revoking & Deleting...' : 'Confirm Deletion & Revoke All Access'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
