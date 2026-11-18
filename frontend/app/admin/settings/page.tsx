'use client'

import React, { useEffect, useState } from 'react'
import { Icons } from '@/components/admin/Icons'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [settings, setSettings] = useState({
    platform_name: 'ExamForge - Rajasthan Informatics Assistant',
    default_marks: '1.00',
    default_negative_marks: '0.25',
    default_passing_percentage: '40.00',
    default_duration_minutes: '60',
    exam_authority: 'RSMSSB (Rajasthan Staff Selection Board)',
    exam_language_default: 'Bilingual (Hindi & English)',
  })

  const loadSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/settings')
      const json = await res.json()
      if (json.success && json.settings) {
        setSettings((prev) => ({ ...prev, ...json.settings }))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSavedSuccess(false)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      })
      const json = await res.json()
      if (json.success) {
        setSavedSuccess(true)
        setTimeout(() => setSavedSuccess(false), 3000)
      } else {
        alert(json.error || 'Failed to save configuration')
      }
    } catch (err) {
      console.error(err)
      alert('Error saving settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-[#262626]">
        <h1 className="text-2xl font-extrabold text-[#FAFAFA] tracking-tight">Platform Settings</h1>
        <p className="text-xs sm:text-sm text-[#71717A] mt-1">
          Configure examination rules, default marking schemes, and Rajasthan IA platform parameters.
        </p>
      </div>

      {/* Scope Restriction Banner */}
      <div className="p-4 rounded-2xl bg-[#151515] text-[#FAFAFA] border border-[#262626] text-xs flex items-start gap-3">
        <Icons.Shield size={18} className="shrink-0 mt-0.5 text-[#FAFAFA]" />
        <div className="space-y-1">
          <span className="font-mono font-bold text-[#FAFAFA] uppercase tracking-wider text-[11px]">
            ExamForge Architecture & Scope Mandate:
          </span>
          <p className="leading-relaxed text-[#A1A1AA]">
            ExamForge is dedicated strictly to curated Rajasthan Government Exam preparation with MySQL persistence, hierarchical syllabus trees, manual MCQ authoring, and candidate per-question time tracking. AI auto-generation and Google Forms export are intentionally omitted in accordance with specifications.
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* General Branding */}
        <div className="bg-[#111111] rounded-2xl border border-[#262626] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#FAFAFA] border-b border-[#1F1F1F] pb-2">
            General Branding & Organization
          </h2>

          <div>
            <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
              Platform Title *
            </label>
            <input
              type="text"
              required
              value={settings.platform_name}
              onChange={(e) => setSettings({ ...settings, platform_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs placeholder-[#71717A] focus:outline-none focus:border-[#52525B]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Conducting Authority
              </label>
              <input
                type="text"
                value={settings.exam_authority}
                onChange={(e) => setSettings({ ...settings, exam_authority: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Language Support
              </label>
              <input
                type="text"
                value={settings.exam_language_default}
                onChange={(e) => setSettings({ ...settings, exam_language_default: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B]"
              />
            </div>
          </div>
        </div>

        {/* Examination Defaults */}
        <div className="bg-[#111111] rounded-2xl border border-[#262626] p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#FAFAFA] border-b border-[#1F1F1F] pb-2">
            Default Marking & Examination Parameters
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Marks / Question
              </label>
              <input
                type="text"
                value={settings.default_marks}
                onChange={(e) => setSettings({ ...settings, default_marks: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Negative Penalty
              </label>
              <input
                type="text"
                value={settings.default_negative_marks}
                onChange={(e) => setSettings({ ...settings, default_negative_marks: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Pass Percentage (%)
              </label>
              <input
                type="text"
                value={settings.default_passing_percentage}
                onChange={(e) => setSettings({ ...settings, default_passing_percentage: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono font-medium text-[#71717A] uppercase mb-1">
                Default Duration (Mins)
              </label>
              <input
                type="text"
                value={settings.default_duration_minutes}
                onChange={(e) => setSettings({ ...settings, default_duration_minutes: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#262626] bg-[#151515] text-[#FAFAFA] text-xs focus:outline-none focus:border-[#52525B] font-mono"
              />
            </div>
          </div>
        </div>

        {/* Database Info Card */}
        <div className="bg-[#111111] rounded-2xl border border-[#262626] p-6 space-y-2">
          <h2 className="text-sm font-bold text-[#FAFAFA]">Database Connection Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-1 text-[#71717A]">
            <div>Engine: <strong className="text-[#FAFAFA]">MySQL 5.5</strong></div>
            <div>Database: <strong className="text-[#FAFAFA]">examforge</strong></div>
            <div>Tables Live: <strong className="text-[#FAFAFA]">34 Active</strong></div>
            <div>Host: <strong className="text-[#FAFAFA]">localhost:3306</strong></div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="text-xs font-mono font-semibold text-[#FAFAFA] flex items-center gap-1.5">
              <Icons.CheckCircle size={15} /> Configuration saved to MySQL successfully!
            </span>
          ) : (
            <span></span>
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-xl bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#090909] text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}
