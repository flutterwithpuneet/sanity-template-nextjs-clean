'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { TableSkeleton } from '@/app/components/Shimmer'

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
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

      const res = await fetch(`/api/admin/students?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setStudents(json.students)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [statusFilter])

  const handleOpenAdd = () => {
    setEditingStudent(null)
    setForm({
      full_name: '',
      email: '',
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
      mobile: st.mobile || '',
      state: st.state || 'Rajasthan',
      district: st.district || 'Jaipur',
      account_status: st.account_status || 'active',
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email) return alert('Name and email are required')

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
        setModalOpen(false)
        fetchStudents()
      } else {
        alert(json.error || 'Failed to save student')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving student')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/students?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteConfirmId(null)
        fetchStudents()
      } else {
        alert(json.error || 'Failed to delete student')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Student Management</h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Candidate profiles, activity tracking, and Rajasthan exam test history.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
        >
          <Icons.Plus size={15} />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Icons.Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            placeholder="Search candidate name, email, roll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchStudents()}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
          >
            <option value="all" className="bg-[#151515] text-[#FAFAFA]">All Accounts</option>
            <option value="active" className="bg-[#151515] text-[#FAFAFA]">Active</option>
            <option value="inactive" className="bg-[#151515] text-[#FAFAFA]">Inactive</option>
            <option value="suspended" className="bg-[#151515] text-[#FAFAFA]">Suspended</option>
          </select>
          <div className="text-xs font-mono font-medium text-[#71717A] whitespace-nowrap">
            {students.length} Candidates
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden">
        {loading ? (
          <TableSkeleton cols={6} rows={5} />
        ) : students.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#71717A]">No candidates found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151515] border-b border-[#262626] text-[10px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Tests Taken</th>
                  <th className="py-3 px-4 text-center">Avg Score</th>
                  <th className="py-3 px-4 text-center">Accuracy</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F] text-xs text-[#FAFAFA]">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-[#151515]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#191919] border border-[#3F3F46] text-[#FAFAFA] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
                          {st.full_name ? st.full_name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <div className="font-semibold text-[#FAFAFA]">{st.full_name}</div>
                          <div className="text-[11px] text-[#71717A] font-mono">{st.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-[#A1A1AA]">{st.district || 'Jaipur'}, {st.state || 'Rajasthan'}</div>
                      <div className="text-[10px] text-[#71717A] font-mono">{st.mobile || 'No Mobile'}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-[#FAFAFA]">
                      {st.attempts_count || 0}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-[#FAFAFA]">
                      {st.avg_score ? `${Number(st.avg_score).toFixed(0)}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-[#FAFAFA]">
                      {st.avg_accuracy ? `${Number(st.avg_accuracy).toFixed(0)}%` : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                          st.account_status === 'active'
                            ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                            : 'bg-[#151515] text-[#71717A] border border-[#262626]'
                        }`}
                      >
                        {st.account_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(st)}
                          className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors"
                          title="Edit Profile"
                        >
                          <Icons.Edit size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(st.id)}
                          className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Delete Account"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <option value="active" className="bg-[#151515] text-[#FAFAFA]">Active</option>
              <option value="inactive" className="bg-[#151515] text-[#FAFAFA]">Inactive</option>
              <option value="suspended" className="bg-[#151515] text-[#FAFAFA]">Suspended</option>
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

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Candidate Account"
        subtitle="Are you sure you want to delete this student?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            This will permanently remove the student profile and their test attempt records from MySQL.
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
