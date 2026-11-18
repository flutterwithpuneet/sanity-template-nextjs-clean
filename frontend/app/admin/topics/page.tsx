'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/admin/Modal'
import { Icons } from '@/components/admin/Icons'
import { CardsGridSkeleton } from '@/app/components/Shimmer'

export default function TopicsPage() {
  const [subjects, setSubjects] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<any>(null)
  const [targetParentId, setTargetParentId] = useState<number | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Form states
  const [topicName, setTopicName] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')

  const loadData = async () => {
    try {
      setLoading(true)
      const [resSubs, resTops] = await Promise.all([
        fetch('/api/admin/subjects').then((r) => r.json()),
        fetch('/api/admin/topics').then((r) => r.json()),
      ])
      if (resSubs.success && resSubs.subjects.length > 0) {
        setSubjects(resSubs.subjects)
        if (!selectedSubjectId) {
          setSelectedSubjectId(resSubs.subjects[0].id)
        }
      }
      if (resTops.success) {
        setTopics(resTops.topics)
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

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId)
  const subjectTopics = topics.filter((t) => t.subject_id === selectedSubjectId)

  // Build recursive topic tree for selected subject
  const buildTree = (parentId: number | null = null, depth: number = 0): Array<any & { depth: number }> => {
    const directChildren = subjectTopics.filter(
      (t) => (t.parent_id === null && parentId === null) || t.parent_id === parentId
    )
    let result: Array<any & { depth: number }> = []

    for (const child of directChildren) {
      result.push({ ...child, depth })
      const subChildren = buildTree(child.id, depth + 1)
      result = result.concat(subChildren)
    }
    return result
  }

  const flattenedTree = buildTree(null, 0)
  const filteredTree = search
    ? flattenedTree.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
    : flattenedTree

  const handleOpenAdd = (parentId: number | null = null) => {
    setEditingTopic(null)
    setTargetParentId(parentId)
    setTopicName('')
    setPriority('medium')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (t: any) => {
    setEditingTopic(t)
    setTargetParentId(t.parent_id)
    setTopicName(t.name)
    setPriority(t.priority || 'medium')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!topicName.trim()) return alert('Topic name is required')

    try {
      const method = editingTopic ? 'PUT' : 'POST'
      const payload = editingTopic
        ? {
            id: editingTopic.id,
            subject_id: selectedSubjectId,
            parent_id: targetParentId,
            name: topicName,
            priority,
          }
        : {
            subject_id: selectedSubjectId,
            parent_id: targetParentId,
            name: topicName,
            priority,
          }

      const res = await fetch('/api/admin/topics', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setIsModalOpen(false)
        loadData()
      } else {
        alert(json.error || 'Failed to save topic')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving topic')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/topics?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setDeleteConfirmId(null)
        loadData()
      } else {
        alert(json.error || 'Failed to delete topic')
      }
    } catch (err) {
      console.error(err)
    }
  }

  const parentTopicName = targetParentId
    ? topics.find((t) => t.id === targetParentId)?.name
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">
            Hierarchical Topic Management
          </h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Multi-level syllabus tree structure (Subject → Topic → Sub-topic → Micro-topic).
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenAdd(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold transition-colors"
        >
          <Icons.Plus size={15} />
          <span>Add Root Topic</span>
        </button>
      </div>

      {/* Subject Selector Tabs */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {subjects.map((sub) => {
            const mainCount = topics.filter((t) => t.subject_id === sub.id && (t.parent_id === null || t.level === 1)).length
            const isSelected = sub.id === selectedSubjectId

            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46] font-semibold'
                    : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#151515] border border-transparent'
                }`}
              >
                <span>{sub.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isSelected ? 'bg-white text-black' : 'bg-[#181818] text-[#A1A1AA] border border-[#262626]'
                  }`}
                  title={`${mainCount} Main Topics`}
                >
                  {mainCount}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tree controls bar */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Icons.Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]"
          />
          <input
            type="text"
            placeholder="Search topics in this subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
          />
        </div>
        <div className="text-xs font-mono font-medium text-[#71717A]">
          Showing {filteredTree.length} nodes in {currentSubject?.name}
        </div>
      </div>

      {/* Tree Display */}
      <div className="bg-[#111111] rounded-2xl border border-[#262626] overflow-hidden">
        <div className="p-4 bg-[#151515] border-b border-[#262626] flex items-center justify-between text-[11px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
          <span className="flex items-center gap-2">
            <Icons.Topics size={15} />
            {currentSubject?.name} Syllabus Hierarchy
          </span>
          <span>Actions</span>
        </div>

        {loading ? (
          <CardsGridSkeleton count={6} />
        ) : filteredTree.length === 0 ? (
          <div className="p-12 text-center text-[#71717A] space-y-3">
            <p className="text-xs font-semibold text-[#A1A1AA]">No topics added for this subject yet.</p>
            <button
              type="button"
              onClick={() => handleOpenAdd(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FAFAFA] text-[#090909] text-xs font-semibold hover:bg-[#E4E4E7]"
            >
              <Icons.Plus size={14} /> Add First Root Topic
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#1F1F1F]">
            {filteredTree.map((node) => {
              const indentPadding = Math.min(node.depth * 28, 140)

              return (
                <div
                  key={node.id}
                  className="p-3.5 sm:p-4 hover:bg-[#151515]/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  style={{ paddingLeft: `${Math.max(16, indentPadding + 16)}px` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center text-[#71717A]">
                      {node.depth > 0 ? (
                        <span className="text-[#52525B] font-mono text-xs mr-1">↳</span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-[#FAFAFA] mr-1.5"></span>
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs sm:text-sm ${
                            node.depth === 0 ? 'text-[#FAFAFA] font-bold' : 'text-[#A1A1AA] font-medium'
                          }`}
                        >
                          {node.name}
                        </span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase border ${
                            node.priority === 'high'
                              ? 'bg-[#191919] text-[#FAFAFA] border-[#3F3F46]'
                              : 'bg-[#151515] text-[#71717A] border-[#262626]'
                          }`}
                        >
                          {node.priority}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#71717A] font-mono">
                        Level {node.depth + 1} Node • {node.questions_count || 0} Questions Linked
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenAdd(node.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#171717] hover:bg-[#202020] hover:border-[#3F3F46] border border-[#262626] text-[#FAFAFA] text-xs font-medium transition-colors"
                      title="Add nested subtopic"
                    >
                      <Icons.Plus size={13} />
                      <span>Add Sub-topic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(node)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#202020] transition-colors"
                      title="Edit Topic"
                    >
                      <Icons.Edit size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(node.id)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      title="Delete Topic"
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

      {/* Add / Edit Topic Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          editingTopic
            ? 'Edit Topic'
            : parentTopicName
            ? `Add Sub-topic under "${parentTopicName}"`
            : `Add Root Topic for ${currentSubject?.name}`
        }
        subtitle="Manage hierarchical topic properties"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Topic Name *
            </label>
            <input
              type="text"
              required
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g. Blood Relation, Direct Relationship, CPU Architecture"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Exam Weightage Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B]"
            >
              <option value="high" className="bg-[#151515] text-[#FAFAFA]">High Priority (High frequency in government exams)</option>
              <option value="medium" className="bg-[#151515] text-[#FAFAFA]">Medium Priority</option>
              <option value="low" className="bg-[#151515] text-[#FAFAFA]">Low Priority</option>
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
              {editingTopic ? 'Update Topic' : 'Create Topic'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Topic Node"
        subtitle="Are you sure you want to delete this topic?"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#A1A1AA] leading-relaxed">
            Deleting this topic node will delete its children subtopics and decouple associated questions. This action is permanent.
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
