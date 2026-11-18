'use client'

import React, { useEffect, useState } from 'react'
import { Icons } from '@/components/admin/Icons'
import { TableSkeleton } from '@/app/components/Shimmer'

export default function ExamsManagementPage() {
  const [exams, setExams] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState<any>(null)

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    status: 'active',
    subject_ids: [] as number[],
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [resExams, resSubs] = await Promise.all([
        fetch('/api/admin/exams').then((r) => r.json()),
        fetch('/api/admin/subjects').then((r) => r.json()),
      ])
      if (resExams.success) setExams(resExams.exams)
      if (resSubs.success) setSubjects(resSubs.subjects)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenCreate = () => {
    setEditingExam(null)
    setForm({
      name: '',
      code: '',
      description: '',
      status: 'active',
      subject_ids: subjects.map((s) => s.id),
    })
    setModalOpen(true)
  }

  const handleOpenEdit = (exam: any) => {
    setEditingExam(exam)
    setForm({
      name: exam.name,
      code: exam.code,
      description: exam.description || '',
      status: exam.status || 'active',
      subject_ids: subjects.map((s) => s.id),
    })
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = '/api/admin/exams'
      const method = editingExam ? 'PUT' : 'POST'
      const payload = editingExam ? { ...form, id: editingExam.id } : form

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setModalOpen(false)
        loadData()
      } else {
        alert(json.error || 'Failed to save exam')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving exam')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exam?')) return
    try {
      const res = await fetch(`/api/admin/exams?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) loadData()
      else alert(json.error || 'Failed to delete exam')
    } catch (err) {
      console.error(err)
    }
  }

  const toggleSubjectSelect = (subId: number) => {
    setForm((prev) => {
      const exists = prev.subject_ids.includes(subId)
      return {
        ...prev,
        subject_ids: exists
          ? prev.subject_ids.filter((id) => id !== subId)
          : [...prev.subject_ids, subId],
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="rounded-2xl bg-[#111111] border border-[#262626] p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase bg-[#151515] text-[#A1A1AA] border border-[#262626] mb-2">
            <span>Government Exam Platform</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
            Exam Management
          </h1>
          <p className="text-xs md:text-sm text-[#A1A1AA] mt-1 max-w-xl leading-relaxed">
            Define recruitment exams and link syllabus subjects to them.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-xl bg-[#FAFAFA] text-[#090909] font-semibold text-xs hover:bg-[#E4E4E7] transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
        >
          <Icons.Plus size={15} />
          Create Exam
        </button>
      </div>

      {/* Exams Grid */}
      {loading ? (
        <TableSkeleton cols={5} rows={4} />
      ) : exams.length === 0 ? (
        <div className="py-16 text-center text-xs text-[#71717A] border border-[#262626] rounded-2xl bg-[#111111]">
          No exams found. Click "Create Exam" to add one.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#3F3F46] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#151515] text-[#FAFAFA] border border-[#262626] font-bold">
                    {exam.code}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                      exam.status === 'active'
                        ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                        : 'bg-[#151515] text-[#71717A] border border-[#262626]'
                    }`}
                  >
                    {exam.status}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#FAFAFA] mb-1.5 leading-snug">
                  {exam.name}
                </h3>
                <p className="text-xs text-[#A1A1AA] line-clamp-2 mb-4 leading-relaxed">
                  {exam.description || 'RSMSSB Informatics Assistant competitive exam.'}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between py-2.5 border-t border-[#1F1F1F] text-xs text-[#71717A] mb-3 font-mono">
                  <span>Linked Subjects: <strong className="text-[#FAFAFA]">{exam.subjects_count}</strong></span>
                  <span>Mock Tests: <strong className="text-[#FAFAFA]">{exam.assessments_count}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(exam)}
                    className="flex-1 py-1.5 rounded-xl bg-[#171717] border border-[#262626] hover:bg-[#202020] hover:border-[#3F3F46] text-[#FAFAFA] font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Icons.Edit size={13} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(exam.id)}
                    className="p-2 rounded-xl bg-[#171717] border border-[#262626] hover:bg-red-950/40 hover:text-red-400 hover:border-red-900/40 text-[#71717A] transition-colors"
                    title="Delete Exam"
                  >
                    <Icons.Trash size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111111] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#262626]">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F1F1F] mb-4">
              <h2 className="text-sm font-bold text-[#FAFAFA]">
                {editingExam ? 'Edit Exam' : 'Create New Exam'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020]"
              >
                <Icons.Close size={17} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                  Exam Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Rajasthan Informatics Assistant"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                  Exam Code *
                </label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. RAJ_IA_2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B] font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Exam description and syllabus coverage..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1.5">
                  Assign Subjects ({form.subject_ids.length} selected)
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl border border-[#262626] bg-[#151515]">
                  {subjects.map((sub) => {
                    const checked = form.subject_ids.includes(sub.id)
                    return (
                      <label
                        key={sub.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          checked
                            ? 'bg-[#191919] border border-[#3F3F46] text-[#FAFAFA]'
                            : 'hover:bg-[#202020] text-[#A1A1AA] border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleSubjectSelect(sub.id)}
                            className="rounded accent-white w-4 h-4"
                          />
                          <span>{sub.name}</span>
                        </div>
                        <span className="font-mono text-[10px] text-[#71717A]">{sub.code}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#1F1F1F]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#262626] text-xs font-medium text-[#A1A1AA] hover:bg-[#202020] hover:text-[#FAFAFA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FAFAFA] text-[#090909] text-xs font-semibold hover:bg-[#E4E4E7]"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
