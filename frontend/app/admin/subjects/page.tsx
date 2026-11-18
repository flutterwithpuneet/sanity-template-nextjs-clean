'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { CardsGridSkeleton } from '@/app/components/Shimmer'

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<any>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'active' | 'inactive'>('active')

  const fetchSubjects = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/subjects')
      const json = await res.json()
      if (json.success) {
        setSubjects(json.subjects)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubjects()
  }, [])

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleOpenAdd = () => {
    setEditingSubject(null)
    setName('')
    setCode(`SUB_0${subjects.length + 1}`)
    setDescription('')
    setStatus('active')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (sub: any) => {
    setEditingSubject(sub)
    setName(sub.name)
    setCode(sub.code)
    setDescription(sub.description || '')
    setStatus(sub.status)
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return alert('Subject name is required')
    if (!code.trim()) return alert('Subject code is required')

    try {
      const method = editingSubject ? 'PUT' : 'POST'
      const payload = editingSubject
        ? { id: editingSubject.id, name, code, description, status }
        : { name, code, description, status }

      const res = await fetch('/api/admin/subjects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setIsModalOpen(false)
        fetchSubjects()
      } else {
        alert(json.error || 'Failed to save subject')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving subject')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteConfirmId(null)
        fetchSubjects()
      } else {
        alert(json.error || 'Failed to delete subject')
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Subject Management</h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Configure Rajasthan Informatics Assistant exam syllabus subjects and view question counts.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
        >
          <Icons.Plus size={15} />
          <span>Add Subject</span>
        </button>
      </div>

      {/* Action bar: Search */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Icons.Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            placeholder="Search subjects by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
          />
        </div>
        <div className="text-xs font-mono font-medium text-[#71717A]">
          Total: {filteredSubjects.length} subjects
        </div>
      </div>

      {/* Subjects Grid */}
      {loading ? (
        <CardsGridSkeleton count={6} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredSubjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-[#111111] rounded-2xl border border-[#262626] p-5 hover:border-[#3F3F46] transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-[#151515] border border-[#262626] text-[#FAFAFA] flex items-center justify-center font-bold font-mono text-xs">
                    {sub.code ? sub.code.substring(0, 3) : 'SUB'}
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                      sub.status === 'active'
                        ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                        : 'bg-[#151515] text-[#71717A] border border-[#262626]'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-[#FAFAFA]">
                    {sub.name}
                  </h3>
                  <p className="text-[11px] font-mono text-[#71717A] mt-0.5">
                    {sub.code}
                  </p>
                </div>

                <p className="text-xs text-[#A1A1AA] line-clamp-2 leading-relaxed">
                  {sub.description || 'Core syllabus module for Rajasthan IA exam preparation.'}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#1F1F1F] flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 font-mono text-[11px] text-[#71717A]">
                  <span><strong className="text-[#FAFAFA]">{sub.topics_count || 0}</strong> Topics</span>
                  <span>•</span>
                  <span><strong className="text-[#FAFAFA]">{sub.questions_count || 0}</strong> Questions</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(sub)}
                    className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors"
                    title="Edit Subject"
                  >
                    <Icons.Edit size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(sub.id)}
                    className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                    title="Delete Subject"
                  >
                    <Icons.Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Subject Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
        subtitle="Manage exam syllabus subject details in MySQL"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Computer Science, Reasoning, Hindi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Subject Code *
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. COMPUTER, REASONING"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B] font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the topics covered in this subject..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B]"
            >
              <option value="active" className="bg-[#151515] text-[#FAFAFA]">Active (Visible in Question Bank & Tests)</option>
              <option value="inactive" className="bg-[#151515] text-[#FAFAFA]">Inactive</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#1F1F1F]">
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
              {editingSubject ? 'Update Subject' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Subject"
        subtitle="Confirm subject removal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Deleting this subject will remove its database entry and linked topics. This action cannot be undone.
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
