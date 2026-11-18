'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Icons } from '@/components/admin/Icons'

const SAMPLE_JSON_TEMPLATE = {
  exam_code: 'RAJ_IA_2026',
  title: 'Rajasthan Informatics Assistant — Full Syllabus Grand Mock 01',
  description: 'Comprehensive full-length drill covering CIT, Reasoning, Mathematics, and Rajasthan General Knowledge with server-validated topic hierarchy.',
  difficulty_level: 'medium',
  duration_minutes: 60,
  passing_percentage: 40.0,
  marks_per_question: 1.0,
  negative_marks_per_question: 0.25,
  questions: [
    {
      subject_code: 'CIT',
      topic_name: 'Networking',
      difficulty: 'medium',
      question_text: 'Which OSI layer is primarily responsible for end-to-end communication, error recovery, and flow control?',
      question_text_hi: 'OSI मॉडल की कौन सी लेयर एंड-टू-एंड संचार, त्रुटि पुनर्प्राप्ति (error recovery) और प्रवाह नियंत्रण (flow control) के लिए मुख्य रूप से जिम्मेदार है?',
      explanation: 'The Transport Layer (Layer 4) provides transparent transfer of data between end users, providing reliable data transfer services to the upper layers including flow control, segmentation, and error recovery.',
      explanation_hi: 'ट्रांसपोर्ट लेयर (लेयर 4) एंड यूजर्स के बीच डेटा का पारदर्शी ट्रांसफर प्रदान करती है और फ्लो कंट्रोल, सेगमेंटेशन एवं एरर रिकवरी की सुविधा देती है।',
      options: [
        { key: 'A', text: 'Network Layer', text_hi: 'नेटवर्क लेयर', is_correct: false },
        { key: 'B', text: 'Transport Layer', text_hi: 'ट्रांसपोर्ट लेयर', is_correct: true },
        { key: 'C', text: 'Data Link Layer', text_hi: 'डेटा लिंक लेयर', is_correct: false },
        { key: 'D', text: 'Session Layer', text_hi: 'सेशन लेयर', is_correct: false }
      ]
    },
    {
      subject_code: 'CIT',
      topic_name: 'DBMS',
      difficulty: 'easy',
      question_text: 'In a relational database, which constraint uniquely identifies each record in a table and cannot contain NULL values?',
      question_text_hi: 'रिलेशनल डेटाबेस में कौन सा कंस्ट्रेंट किसी टेबल के प्रत्येक रिकॉर्ड को विशिष्ट रूप से पहचानता है और NULL मान नहीं रख सकता?',
      explanation: 'A Primary Key uniquely identifies each tuple in a relational database table and strictly rejects duplicate and NULL values.',
      explanation_hi: 'प्राइमरी की (Primary Key) टेबल के प्रत्येक रिकॉर्ड को विशिष्ट पहचान देती है और कभी भी NULL या डुप्लीकेट मान स्वीकार नहीं करती।',
      options: [
        { key: 'A', text: 'Foreign Key', text_hi: 'फॉरेन की (Foreign Key)', is_correct: false },
        { key: 'B', text: 'Primary Key', text_hi: 'प्राइमरी की (Primary Key)', is_correct: true },
        { key: 'C', text: 'Unique Key', text_hi: 'यूनिक की (Unique Key)', is_correct: false },
        { key: 'D', text: 'Candidate Key', text_hi: 'कैंडिडेट की (Candidate Key)', is_correct: false }
      ]
    },
    {
      subject_code: 'RMA',
      topic_name: 'Coding-Decoding',
      difficulty: 'medium',
      question_text: "In a certain code language, if 'COMPUTER' is written as 'RFUVQNPC', how will 'PRINTER' be written in that same code?",
      question_text_hi: "एक निश्चित कूट भाषा में यदि 'COMPUTER' को 'RFUVQNPC' लिखा जाता है, तो उसी कूट में 'PRINTER' को कैसे लिखा जाएगा?",
      explanation: 'The word letters are reversed and transformed via position shift algorithm.',
      explanation_hi: 'शब्द को उल्टा करके वर्णमाला के विशिष्ट नियम के अनुसार बदला गया है।',
      options: [
        { key: 'A', text: 'SFUOJSQ', text_hi: 'SFUOJSQ', is_correct: true },
        { key: 'B', text: 'SFUOJSP', text_hi: 'SFUOJSP', is_correct: false },
        { key: 'C', text: 'RFUOJSQ', text_hi: 'RFUOJSQ', is_correct: false },
        { key: 'D', text: 'SFTNISQ', text_hi: 'SFTNISQ', is_correct: false }
      ]
    },
    {
      subject_code: 'MATH',
      topic_name: 'Percentage',
      difficulty: 'easy',
      question_text: 'If the price of a computer part is increased by 20% and then reduced by 20%, what is the net percentage change in price?',
      question_text_hi: 'यदि कंप्यूटर घटक के मूल्य में पहले 20% की वृद्धि और फिर 20% की कमी की जाती है, तो मूल्य में शुद्ध प्रतिशत परिवर्तन क्या होगा?',
      explanation: 'Net change = (+20) + (-20) + (20 * -20) / 100 = -4% (A decrease of 4%).',
      explanation_hi: 'शुद्ध परिवर्तन = (+20) + (-20) + (20 * -20) / 100 = -4% (4% की शुद्ध कमी)।',
      options: [
        { key: 'A', text: 'No change (0%)', text_hi: 'कोई परिवर्तन नहीं (0%)', is_correct: false },
        { key: 'B', text: '4% decrease', text_hi: '4% की कमी', is_correct: true },
        { key: 'C', text: '4% increase', text_hi: '4% की वृद्धि', is_correct: false },
        { key: 'D', text: '2% decrease', text_hi: '2% की कमी', is_correct: false }
      ]
    },
    {
      subject_code: 'GK',
      topic_name: 'Rajasthan GK',
      difficulty: 'medium',
      question_text: 'Which initiative of the Government of Rajasthan provides free public Wi-Fi connectivity and digital service infrastructure across gram panchayats?',
      question_text_hi: 'राजस्थान सरकार की कौन सी पहल ग्राम पंचायतों में मुफ्त सार्वजनिक वाई-फाई कनेक्टिविटी और डिजिटल सेवा अवसंरचना प्रदान करती है?',
      explanation: 'RajNet is the comprehensive satellite and optical terrestrial network providing digital connectivity to gram panchayats across Rajasthan.',
      explanation_hi: 'राजनेट (RajNet) राजस्थान सरकार की उपग्रह और ऑप्टिकल नेटवर्क पहल है जो राज्य की सभी ग्राम पंचायतों को जोड़ती है।',
      options: [
        { key: 'A', text: 'RajNet', text_hi: 'राजनेट (RajNet)', is_correct: true },
        { key: 'B', text: 'RajWiFi', text_hi: 'राजवाईफाई', is_correct: false },
        { key: 'C', text: 'DigiSthal', text_hi: 'डिजीस्थल', is_correct: false },
        { key: 'D', text: 'e-Panchayat', text_hi: 'ई-पंचायत', is_correct: false }
      ]
    }
  ]
}

const AI_PROMPT_TEMPLATE = `You are an expert exam paper setter for the Rajasthan Informatics Assistant (सूचना सहायक - RSMMB / RSSB) examination.

I need you to generate an examination Mock Test in 100% VALID JSON format that strictly adheres to our system's database schema and topic hierarchy.

### CRITICAL RULES:
1. Every question MUST match an existing Subject Code and an allowed Topic Name from the following list:
   - Subject "CIT" (Computer & Information Technology):
     Allowed Topics: "Computer Fundamentals", "Hardware", "Software", "Networking", "Internet", "DBMS", "MS Office", "Algorithm Fundamentals"
   - Subject "RMA" (Reasoning & Mental Ability):
     Allowed Topics: "Blood Relation", "Coding-Decoding", "Series", "Direction", "Analogy", "Ranking", "Puzzle"
   - Subject "MATH" (Mathematics):
     Allowed Topics: "Percentage", "Profit-Loss", "Average", "Ratio", "Time & Work", "SI-CI"
   - Subject "GK" (General Knowledge):
     Allowed Topics: "Rajasthan GK", "India GK", "History", "Geography", "Polity", "Current Affairs", "General Science"

2. Bilingual Question Requirements:
   - "question_text": Clear, technically accurate English question statement.
   - "question_text_hi": Pure, grammatically sound Hindi translation (देवनागरी लिपि).
   - "explanation": In-depth English explanation of the correct answer.
   - "explanation_hi": In-depth Hindi explanation (व्याख्या) of the correct answer.

3. Options Requirements:
   - Exactly 4 options with keys "A", "B", "C", "D".
   - Both "text" (English) and "text_hi" (Hindi) for all 4 options.
   - Exactly ONE option MUST have "is_correct": true, and the other 3 MUST have "is_correct": false.

4. Output ONLY pure, valid JSON (no markdown backticks, no markdown fence, no preamble text):

{
  "exam_code": "RAJ_IA_2026",
  "title": "[Insert Test Title, e.g. 'Informatics Assistant Mega Drill #10']",
  "description": "[Brief 1-2 sentence description]",
  "difficulty_level": "medium",
  "duration_minutes": 60,
  "passing_percentage": 40.0,
  "marks_per_question": 1.0,
  "negative_marks_per_question": 0.25,
  "questions": [
    ...
  ]
}`

export default function ImportMockPage() {
  const [activeTab, setActiveTab] = useState<'importer' | 'ai_prompt'>('importer')
  const [jsonInput, setJsonInput] = useState<string>('')
  const [validating, setValidating] = useState<boolean>(false)
  const [importing, setImporting] = useState<boolean>(false)
  const [validationResult, setValidationResult] = useState<any>(null)
  const [importSuccess, setImportSuccess] = useState<any>(null)
  const [hierarchyData, setHierarchyData] = useState<any>(null)
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false)
  const [copiedJson, setCopiedJson] = useState<boolean>(false)

  // Fetch live hierarchy from DB on mount
  useEffect(() => {
    fetch('/api/admin/mock-tests/import')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setHierarchyData(data)
        }
      })
      .catch((err) => console.error('Failed to load hierarchy data:', err))
  }, [])

  // Load sample template into editor
  const handleLoadSample = () => {
    setJsonInput(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2))
    setValidationResult(null)
    setImportSuccess(null)
  }

  // Format / Beautify JSON
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      setJsonInput(JSON.stringify(parsed, null, 2))
    } catch (err: any) {
      alert(`Invalid JSON format: ${err.message}`)
    }
  }

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setJsonInput(content)
      setValidationResult(null)
      setImportSuccess(null)
    }
    reader.readAsText(file)
  }

  // Validate JSON against Database Hierarchy
  const handleValidate = async () => {
    if (!jsonInput.trim()) {
      alert('Please enter or paste a JSON payload first.')
      return
    }

    try {
      setValidating(true)
      setValidationResult(null)
      setImportSuccess(null)

      let parsed: any
      try {
        parsed = JSON.parse(jsonInput)
      } catch (err: any) {
        setValidationResult({
          valid: false,
          errors: [`JSON Syntax Error: ${err.message}. Please check missing commas, brackets, or unescaped quotes.`],
        })
        setValidating(false)
        return
      }

      const res = await fetch('/api/admin/mock-tests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', payload: parsed }),
      })

      const data = await res.json()
      setValidationResult(data)
    } catch (err: any) {
      setValidationResult({
        valid: false,
        errors: [`Network or Validation Error: ${err.message}`],
      })
    } finally {
      setValidating(false)
    }
  }

  // Execute Import & Creation in Database
  const handleImport = async () => {
    if (!validationResult?.valid) {
      alert('Please validate the JSON successfully before importing.')
      return
    }

    if (!confirm(`Are you sure you want to import and publish "${validationResult.summary?.title}" with ${validationResult.summary?.total_questions} questions?`)) {
      return
    }

    try {
      setImporting(true)
      const parsed = JSON.parse(jsonInput)

      const res = await fetch('/api/admin/mock-tests/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', payload: parsed }),
      })

      const data = await res.json()
      if (data.success && data.assessment_id) {
        setImportSuccess(data)
        setValidationResult(null)
      } else {
        alert(data.errors?.join('\n') || data.error || 'Failed to import mock test.')
      }
    } catch (err: any) {
      alert(`Import error: ${err.message}`)
    } finally {
      setImporting(false)
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE)
    setCopiedPrompt(true)
    setTimeout(() => setCopiedPrompt(false), 2500)
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2500)
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header with Breadcrumbs & Action Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262626]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#71717A] mb-1">
            <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
            <span>/</span>
            <Link href="/admin/practice-tests" className="hover:text-white transition-colors">Mock Tests</Link>
            <span>/</span>
            <span className="text-white">JSON Importer</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Icons.Upload size={22} className="text-[#A1A1AA]" />
            <span>Mock Test JSON Importer</span>
          </h1>
          <p className="text-xs text-[#A1A1AA] mt-1">
            Import full mock tests with strict Exam → Subject → Topic hierarchy validation.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-[#141414] border border-[#262626] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('importer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'importer'
                ? 'bg-[#202020] text-white border border-[#383838] shadow-xs'
                : 'text-[#71717A] hover:text-white'
            }`}
          >
            JSON Importer
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai_prompt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'ai_prompt'
                ? 'bg-[#202020] text-white border border-[#383838] shadow-xs'
                : 'text-[#71717A] hover:text-white'
            }`}
          >
            <span>AI Prompt & Schema</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#2A2A2A] text-amber-400 font-mono font-bold">
              AI Ready
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: JSON IMPORTER & VALIDATOR                              */}
      {/* ============================================================= */}
      {activeTab === 'importer' && (
        <div className="space-y-6">
          {/* Success Banner when test is created */}
          {importSuccess && (
            <div className="p-6 rounded-2xl bg-[#0F1C12] border border-emerald-600/70 text-emerald-200 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-900/60 border border-emerald-500/80 flex items-center justify-center text-emerald-200">
                    <Icons.Check size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-100">
                      Mock Test Successfully Created & Published!
                    </h3>
                    <p className="text-xs text-emerald-300">
                      "{importSuccess.title}" with {importSuccess.total_questions} questions has been inserted into the database.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/practice/${importSuccess.assessment_id}`}
                    target="_blank"
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <span>Launch in Portal</span>
                    <Icons.ExternalLink size={13} />
                  </Link>
                  <Link
                    href="/admin/practice-tests"
                    className="px-3.5 py-2 rounded-xl bg-[#161616] hover:bg-[#202020] border border-[#262626] text-white font-bold text-xs transition-colors"
                  >
                    View Mock Tests List
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Editor Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#141414] border border-[#262626]">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] border border-[#303030] text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Icons.FileCode size={14} className="text-[#A1A1AA]" />
                <span>Load Sample Template</span>
              </button>

              <button
                type="button"
                onClick={handleFormatJson}
                disabled={!jsonInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] border border-[#303030] text-xs font-semibold text-white transition-colors cursor-pointer disabled:opacity-40"
              >
                Format / Beautify
              </button>

              <label className="px-3 py-1.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] border border-[#303030] text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5">
                <Icons.Upload size={14} className="text-[#A1A1AA]" />
                <span>Upload .json File</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {jsonInput && (
                <button
                  type="button"
                  onClick={() => {
                    setJsonInput('')
                    setValidationResult(null)
                    setImportSuccess(null)
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs text-[#71717A] hover:text-white transition-colors cursor-pointer"
                >
                  Clear Editor
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleValidate}
                disabled={validating || !jsonInput.trim()}
                className="px-4 py-2 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
              >
                {validating ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                    <span>Validating Hierarchy...</span>
                  </>
                ) : (
                  <>
                    <Icons.Check size={14} />
                    <span>Validate JSON & Hierarchy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Main JSON Textarea */}
          <div className="relative rounded-2xl bg-[#111111] border border-[#262626] overflow-hidden focus-within:border-white/50 transition-colors">
            <div className="p-3 bg-[#0C0C0C] border-b border-[#262626] flex items-center justify-between text-[11px] font-mono text-[#71717A]">
              <span>JSON Payload Editor</span>
              <span>
                {jsonInput ? `${jsonInput.length} characters` : 'Paste JSON below'}
              </span>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value)
                setValidationResult(null)
              }}
              placeholder={`{\n  "exam_code": "RAJ_IA_2026",\n  "title": "Rajasthan Informatics Assistant — Grand Drill 01",\n  "questions": [\n    ...\n  ]\n}`}
              rows={18}
              className="w-full p-4 bg-[#111111] text-[#FAFAFA] font-mono text-xs leading-relaxed focus:outline-none resize-y placeholder-[#52525B]"
              spellCheck={false}
            />
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div className="space-y-4">
              {validationResult.valid ? (
                /* VALID STATUS CARD */
                <div className="p-6 rounded-2xl bg-[#0F1C12] border border-emerald-600/70 text-emerald-200 space-y-5 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-900/60 border border-emerald-500/80 flex items-center justify-center text-emerald-200">
                        <Icons.Check size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-400 block">
                          Hierarchy & Schema Check Passed
                        </span>
                        <h3 className="text-lg font-black text-white">
                          {validationResult.summary?.title}
                        </h3>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleImport}
                      disabled={importing}
                      className="px-6 py-2.5 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-black text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-40"
                    >
                      {importing ? (
                        <>
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                          <span>Creating Test in Database...</span>
                        </>
                      ) : (
                        <>
                          <span>Import & Publish Mock Test</span>
                          <Icons.ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Summary Metric Pills */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-emerald-900/60">
                    <div className="p-3 rounded-xl bg-[#112416] border border-emerald-800/60">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        Matched Exam
                      </span>
                      <span className="text-xs font-bold text-white block mt-0.5 truncate">
                        {validationResult.summary?.exam?.name || 'Rajasthan Informatics Assistant'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#112416] border border-emerald-800/60">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        Total Questions
                      </span>
                      <span className="text-lg font-black font-mono text-white block mt-0.5">
                        {validationResult.summary?.total_questions} Questions
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#112416] border border-emerald-800/60">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        Duration & Level
                      </span>
                      <span className="text-xs font-bold text-white block mt-0.5 uppercase">
                        {validationResult.summary?.duration_minutes}m • {validationResult.summary?.difficulty_level}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#112416] border border-emerald-800/60">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                        Scoring Scheme
                      </span>
                      <span className="text-xs font-bold text-white block mt-0.5 font-mono">
                        +{validationResult.summary?.marks_per_question} / -{validationResult.summary?.negative_marks_per_question}
                      </span>
                    </div>
                  </div>

                  {/* Subject Distribution */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-emerald-300 block">
                      Subject Distribution Verified:
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {Object.entries(validationResult.summary?.subject_breakdown || {}).map(([subCode, count]) => (
                        <span
                          key={subCode}
                          className="px-2.5 py-1 rounded-lg bg-[#142C1B] border border-emerald-700/80 text-emerald-200 text-xs font-mono font-bold"
                        >
                          {subCode}: <strong className="text-white">{String(count)} Qs</strong>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Warnings if any */}
                  {validationResult.warnings && validationResult.warnings.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <span>⚠️ Minor Recommendations ({validationResult.warnings.length}):</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200">
                        {validationResult.warnings.slice(0, 5).map((w: string, i: number) => (
                          <li key={i}>{w}</li>
                        ))}
                        {validationResult.warnings.length > 5 && (
                          <li>...and {validationResult.warnings.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* INVALID STATUS CARD */
                <div className="p-6 rounded-2xl bg-[#1C0D0F] border border-rose-600/70 text-rose-200 space-y-4 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-900/60 border border-rose-500/80 flex items-center justify-center text-rose-200 font-bold text-lg">
                      ✕
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Hierarchy Validation Failed ({validationResult.errors?.length || 0} Issues Detected)
                      </h3>
                      <p className="text-xs text-rose-300">
                        Please resolve the errors below in your JSON payload before attempting database insertion.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-rose-900/60">
                    <div className="max-h-60 overflow-y-auto space-y-1.5 pr-2 custom-scrollbar">
                      {validationResult.errors?.map((err: string, i: number) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-lg bg-[#250F12] border border-rose-800/60 text-xs text-rose-100 flex items-start gap-2"
                        >
                          <span className="text-rose-400 font-mono font-bold shrink-0">#{i + 1}</span>
                          <span className="leading-relaxed">{err}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: AI PROMPT GENERATOR & DATABASE SCHEMA REFERENCE         */}
      {/* ============================================================= */}
      {activeTab === 'ai_prompt' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Explanatory Banner */}
          <div className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>AI Prompt Generator for ChatGPT / Claude / Gemini</span>
            </h2>
            <p className="text-xs text-[#A1A1AA] leading-relaxed">
              Copy this prompt and paste it directly into an AI model (like ChatGPT Plus, Claude 3.5 Sonnet, or Gemini Pro). It instructs the AI to generate a full Rajasthan Informatics Assistant test with 100% matching database topic hierarchy, bilingual Hindi/English questions, and valid JSON structure.
            </p>
          </div>

          {/* Copyable AI Prompt Box */}
          <div className="rounded-2xl bg-[#111111] border border-[#262626] overflow-hidden">
            <div className="p-3.5 bg-[#161616] border-b border-[#262626] flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span>📋 Ready-to-Use AI Prompt</span>
              </span>
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="px-3 py-1.5 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedPrompt ? (
                  <>
                    <Icons.Check size={14} />
                    <span>Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Icons.Bookmark size={14} />
                    <span>Copy Full AI Prompt</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-[#D4D4D8] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto bg-[#0F0F0F] custom-scrollbar">
              {AI_PROMPT_TEMPLATE}
            </pre>
          </div>

          {/* Database Hierarchy Reference Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider text-[#A1A1AA]">
              Allowed Database Hierarchy (Exams → Subjects → Topics)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hierarchyData?.subjects?.map((sub: any) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-2xl bg-[#141414] border border-[#262626] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#222222] text-white border border-[#303030]">
                        Code: {sub.code}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1.5">{sub.name}</h4>
                    </div>
                    <span className="text-xs text-[#71717A] font-mono">
                      {sub.topics?.length || 0} Topics
                    </span>
                  </div>

                  <p className="text-[11px] text-[#71717A] line-clamp-1">
                    {sub.description}
                  </p>

                  <div className="pt-2 border-t border-[#262626] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A] block">
                      Valid Topic Names (Exact Match Required):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {sub.topics?.map((top: any) => (
                        <span
                          key={top.id}
                          className="px-2 py-0.5 rounded-md bg-[#1B1B1B] border border-[#2A2A2A] text-[11px] text-[#D4D4D8] font-medium"
                        >
                          {top.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Valid JSON Preview Box */}
          <div className="rounded-2xl bg-[#111111] border border-[#262626] overflow-hidden">
            <div className="p-3.5 bg-[#161616] border-b border-[#262626] flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                📦 Valid JSON Format Example (5 Bilingual Questions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] border border-[#303030] text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {copiedJson ? 'Copied!' : 'Copy JSON'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLoadSample()
                    setActiveTab('importer')
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#D4D4D8] hover:bg-[#E4E4E7] text-[#111111] font-bold text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Load Directly into Editor
                </button>
              </div>
            </div>
            <pre className="p-4 text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto bg-[#090909] custom-scrollbar">
              {JSON.stringify(SAMPLE_JSON_TEMPLATE, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
