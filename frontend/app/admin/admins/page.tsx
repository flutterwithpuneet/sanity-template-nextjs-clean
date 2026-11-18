'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { TableSkeleton } from '@/app/components/Shimmer'

export default function AdminsManagementPage() {
  const [admins, setAdmins] = useState<any[]>([])
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role_id: 2,
    status: 'active',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/admins')
      const json = await res.json()
      if (json.success) {
        setAdmins(json.admins)
        setRoles(json.roles)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email) return alert('Name and email are required')

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        setModalOpen(false)
        loadData()
      } else {
        alert(json.error || 'Failed to save admin user')
      }
    } catch (err) {
      console.error(err)
      alert('Error creating admin')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/admins?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteConfirmId(null)
        loadData()
      } else {
        alert(json.error || 'Failed to delete admin')
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
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Admin & Role Management</h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Control platform administrative access, roles, and content permissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm({ full_name: '', email: '', role_id: 2, status: 'active' })
            setModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
        >
          <Icons.Plus size={15} />
          <span>Add Admin User</span>
        </button>
      </div>

      {/* Role Definitions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {roles.map((r) => (
          <div key={r.id} className="p-3.5 rounded-xl bg-[#111111] border border-[#262626]">
            <div className="text-xs font-bold font-mono text-[#FAFAFA] uppercase">{r.name}</div>
            <div className="text-[11px] text-[#71717A] mt-1 line-clamp-2 leading-relaxed">{r.description}</div>
          </div>
        ))}
      </div>

      {/* Admins Table */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden">
        <div className="p-4 bg-[#151515] border-b border-[#262626] flex items-center justify-between text-[11px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
          <span>Active Staff & Content Administrators</span>
          <span>{admins.length} accounts</span>
        </div>

        {loading ? (
          <TableSkeleton cols={4} rows={3} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#151515] border-b border-[#262626] text-[10px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Assigned Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F] text-xs">
                {admins.map((u) => (
                  <tr key={u.id} className="hover:bg-[#151515]/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#191919] border border-[#3F3F46] text-[#FAFAFA] flex items-center justify-center font-bold font-mono text-xs">
                          {u.full_name ? u.full_name.charAt(0) : 'A'}
                        </div>
                        <div>
                          <div className="font-semibold text-[#FAFAFA]">{u.full_name}</div>
                          <div className="text-[11px] text-[#71717A] font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[11px] uppercase px-2 py-0.5 rounded bg-[#151515] text-[#FAFAFA] border border-[#262626]">
                        {u.role_name || 'admin'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                          u.status === 'active'
                            ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                            : 'bg-[#151515] text-[#71717A] border border-[#262626]'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#71717A] font-mono text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'System'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== 1 && (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(u.id)}
                          className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                          title="Revoke Admin Access"
                        >
                          <Icons.Trash size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Admin Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Admin User"
        subtitle="Create an internal account and assign permission roles"
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
              placeholder="e.g. Ramesh Kumar"
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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="e.g. ramesh@examforge.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Administrative Role
            </label>
            <select
              value={form.role_id}
              onChange={(e) => setForm({ ...form, role_id: Number(e.target.value) })}
              className="w-full px-3.5 py-2 rounded-xl border border-[#262626] text-xs bg-[#151515] text-[#FAFAFA] focus:outline-none focus:border-[#52525B]"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id} className="bg-[#151515] text-[#FAFAFA]">
                  {r.name} — {r.description}
                </option>
              ))}
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
              Grant Access
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Revoke Admin Access"
        subtitle="Confirm removal of administrator account"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            This will immediately revoke all administrative privileges for this account.
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
              Confirm Revoke
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
