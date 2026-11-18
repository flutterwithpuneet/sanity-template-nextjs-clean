'use client'

import React, { useEffect, useState } from 'react'
import { Icons } from '@/components/admin/Icons'
import { toast } from 'sonner'

interface AuditLogItem {
  id: number
  actor_id: number | null
  actor_role: string | null
  action: string
  affected_student_id: number | null
  target_id: number | null
  target_type: string | null
  details: string | null
  ip_address: string | null
  created_at: string
  actor_name: string | null
  affected_student_name: string | null
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('all')

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const url = actionFilter === 'all' ? '/api/admin/audit-logs' : `/api/admin/audit-logs?action=${actionFilter}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setLogs(data.logs || [])
      } else {
        toast.error(data.error || 'Failed to load audit logs')
      }
    } catch {
      toast.error('Error fetching audit logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [actionFilter])

  const getActionBadge = (action: string) => {
    if (action.includes('DELETED') || action.includes('REVOKED') || action.includes('FAILED') || action.includes('UNAUTHORIZED')) {
      return 'bg-red-950/60 text-red-400 border border-red-800'
    }
    if (action.includes('CREATED') || action.includes('REACTIVATED') || action.includes('SUCCESS') || action.includes('ASSIGNED')) {
      return 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
    }
    return 'bg-blue-950/60 text-blue-400 border border-blue-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
            <Icons.AuditLogs className="text-white" size={24} />
            Security & Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1">
            Real-time security trail for user logins, mock test assignments, student deletions, and unauthorized access attempts.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3.5 py-1.5 bg-[#171717] hover:bg-[#202020] text-[#FAFAFA] border border-[#333] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Icons.Refresh size={14} />
          Refresh Log
        </button>
      </div>

      {/* Action Filter */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'All Actions' },
          { id: 'STUDENT_DELETED', label: 'Student Deletions' },
          { id: 'MOCK_TEST_ASSIGNED', label: 'Test Assignments' },
          { id: 'MOCK_TEST_REVOKED', label: 'Test Revocations' },
          { id: 'LOGIN_SUCCESS', label: 'Login Success' },
          { id: 'LOGIN_FAILED', label: 'Failed Logins' },
          { id: 'UNAUTHORIZED_ACCESS_ATTEMPT', label: 'Unauthorized Attempts' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActionFilter(f.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              actionFilter === f.id
                ? 'bg-white text-black font-bold'
                : 'bg-[#141414] text-[#A3A3A3] hover:text-white border border-[#262626]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      <div className="bg-[#121212] border border-[#262626] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#171717] text-[#A3A3A3] border-b border-[#262626]">
              <tr>
                <th className="py-3 px-4 font-semibold">Timestamp</th>
                <th className="py-3 px-4 font-semibold">Action</th>
                <th className="py-3 px-4 font-semibold">Actor</th>
                <th className="py-3 px-4 font-semibold">Affected Entity</th>
                <th className="py-3 px-4 font-semibold">Details / Context</th>
                <th className="py-3 px-4 font-semibold">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#737373]">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#737373]">
                    No audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#171717]/50 transition-colors">
                    <td className="py-3 px-4 text-[#737373] whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{log.actor_name || 'System'}</div>
                      <div className="text-[10px] text-[#737373] capitalize font-mono">{log.actor_role || 'system'}</div>
                    </td>
                    <td className="py-3 px-4">
                      {log.affected_student_name ? (
                        <div>
                          <span className="font-medium text-[#FAFAFA]">{log.affected_student_name}</span>
                          <span className="text-[10px] text-[#737373] ml-1">#{log.affected_student_id}</span>
                        </div>
                      ) : log.target_type ? (
                        <span className="text-[#A3A3A3]">
                          {log.target_type} {log.target_id ? `(#${log.target_id})` : ''}
                        </span>
                      ) : (
                        <span className="text-[#555]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#A3A3A3] max-w-xs truncate" title={log.details || ''}>
                      {log.details ? (
                        <code className="text-[11px] font-mono text-neutral-300 bg-[#1C1C1C] px-1.5 py-0.5 rounded">
                          {log.details.length > 50 ? `${log.details.slice(0, 50)}...` : log.details}
                        </code>
                      ) : (
                        <span className="text-[#555]">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#737373] font-mono text-[11px] whitespace-nowrap">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
