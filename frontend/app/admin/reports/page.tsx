'use client'

import React, { useEffect, useState } from 'react'
import { Icons } from '@/components/admin/Icons'
import { TableSkeleton } from '@/app/components/Shimmer'

export default function ReportsManagementPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchReports = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const res = await fetch(`/api/admin/reports?${params.toString()}`)
      const json = await res.json()
      if (json.success) {
        setReports(json.reports)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [statusFilter])

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (json.success) {
        fetchReports()
      } else {
        alert(json.error || 'Failed to update report')
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
          <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Question Error Reports & Feedback</h1>
          <p className="text-xs sm:text-sm text-[#71717A] mt-1">
            Candidate reports regarding ambiguous questions, option discrepancies, or typos.
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'pending', 'reviewed', 'resolved', 'rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-mono font-semibold uppercase text-[10px] transition-colors ${
                statusFilter === st
                  ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                  : 'bg-[#151515] text-[#71717A] border border-[#262626] hover:text-[#FAFAFA]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      {loading ? (
        <TableSkeleton cols={5} rows={4} />
      ) : reports.length === 0 ? (
        <div className="p-12 text-center text-[#71717A] bg-[#111111] rounded-2xl border border-[#262626] space-y-2">
          <p className="text-xs font-semibold text-[#A1A1AA]">No question reports matching filter.</p>
          <p className="text-[11px] text-[#71717A]">All questions are currently verified without pending flags.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => (
            <div
              key={rep.id}
              className="p-5 rounded-2xl bg-[#111111] border border-[#262626] hover:border-[#3F3F46] transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#151515] text-[#FAFAFA] border border-[#262626]">
                    Report #{rep.id}
                  </span>
                  <span className="text-xs font-semibold text-[#FAFAFA]">{rep.subject_name}</span>
                  <span className="text-[#52525B]">•</span>
                  <span className="text-xs text-[#71717A]">Question #{rep.question_id}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-[#151515] text-[#A1A1AA] border border-[#262626]">
                    Type: {rep.report_type.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full ${
                      rep.status === 'resolved'
                        ? 'bg-[#191919] text-[#FAFAFA] border border-[#3F3F46]'
                        : rep.status === 'pending'
                        ? 'bg-[#151515] text-[#A1A1AA] border border-[#262626]'
                        : 'bg-[#151515] text-[#52525B] border border-[#262626]'
                    }`}
                  >
                    {rep.status}
                  </span>
                </div>
              </div>

              {/* Question snippet */}
              <div className="p-3 rounded-xl bg-[#151515] border border-[#262626] text-xs">
                <span className="font-mono font-bold text-[#71717A] uppercase text-[10px] block mb-0.5">Reported Question Statement:</span>
                <p className="text-[#FAFAFA] font-medium leading-relaxed">{rep.question_text}</p>
              </div>

              {/* Feedback note */}
              <div className="text-xs text-[#A1A1AA] leading-relaxed">
                <span className="font-semibold text-[#FAFAFA]">Candidate Feedback: </span>
                <span>{rep.description || 'No additional comment provided by student.'}</span>
              </div>

              {/* Meta & actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1F1F1F] text-xs text-[#71717A]">
                <div>
                  Reported by: <strong className="text-[#FAFAFA]">{rep.student_name}</strong> ({rep.student_email})
                </div>

                <div className="flex items-center gap-2">
                  {rep.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(rep.id, 'resolved')}
                      className="px-3 py-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] font-semibold text-xs transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {rep.status !== 'reviewed' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(rep.id, 'reviewed')}
                      className="px-3 py-1.5 rounded-lg bg-[#171717] border border-[#262626] hover:bg-[#202020] hover:border-[#3F3F46] text-[#FAFAFA] font-medium text-xs transition-colors"
                    >
                      Under Review
                    </button>
                  )}
                  {rep.status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(rep.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-[#151515] border border-[#262626] hover:bg-[#202020] text-[#71717A] hover:text-[#FAFAFA] font-medium text-xs transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
