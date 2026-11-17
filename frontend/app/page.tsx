import { Suspense } from 'react'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import { AllPosts } from '@/app/components/Posts'
import { settingsQuery } from '@/sanity/lib/queries'
import { sanityFetch } from '@/sanity/lib/live'
import { dataAttr } from '@/sanity/lib/utils'

export default async function Page() {
  let settings: any = null
  try {
    const res = await sanityFetch({
      query: settingsQuery,
    })
    settings = res.data
  } catch {
    // Fallback when Sanity is not connected
  }

  const subjects = [
    { id: 1, name: 'Computer & IT', code: 'CIT', count: '100+ MCQs', icon: '💻', desc: 'Hardware, Networking, Internet, DBMS, MS Office' },
    { id: 2, name: 'Reasoning & Mental Ability', code: 'RMA', count: '100+ MCQs', icon: '🧩', desc: 'Blood Relations, Coding-Decoding, Series, Direction' },
    { id: 3, name: 'Quantitative Aptitude', code: 'MATH', count: '80+ MCQs', icon: '📐', desc: 'Percentage, Profit-Loss, Time & Work, Average, Ratio' },
    { id: 4, name: 'Rajasthan General Knowledge', code: 'GK', count: '150+ MCQs', icon: '🏛️', desc: 'History, Geography, Art & Culture, Current Affairs' },
    { id: 5, name: 'General Science', code: 'SCI', count: '60+ MCQs', icon: '🔬', desc: 'Physics, Chemistry, Biology & Everyday Science' },
    { id: 6, name: 'Hindi & English Language', code: 'LANG', count: '90+ MCQs', icon: '📚', desc: 'Grammar, Sandhi, Samas, Vocabulary, Comprehension' },
  ]

  return (
    <div className="space-y-20 pb-24 text-slate-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 bg-gradient-to-b from-blue-50/70 via-indigo-50/30 to-white border-b border-slate-200/70">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]"></div>

        <div className="container mx-auto px-4 sm:px-6 max-w-5xl text-center space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white text-blue-700 text-xs font-semibold shadow-xs border border-blue-200/80">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Rajasthan Informatics Assistant (सूचना सहायक) 2026 Test Series</span>
          </div>

          {/* Heading */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Master Government Exams with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700">Precision & Speed</span>
            </h1>

            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Targeted bilingual practice drills, verified standard question repository, authentic exam environment, and second-by-second performance analytics.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/practice"
              className="px-7 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2.5 group"
            >
              <span>Start Free Practice Drill</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="group-hover:translate-x-1 transition-transform"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>

            <Link
              href="/admin/questions"
              className="px-6 py-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-xs hover:border-slate-300 transition-all duration-200 flex items-center gap-2"
            >
              <span>Explore Question Bank</span>
            </Link>

            <Link
              href="/admin"
              className="px-5 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-sm transition-all duration-200"
            >
              Admin Dashboard
            </Link>
          </div>

          {/* Highlights Grid */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">⏱️</div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Time Analytics</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">Per-Question Timing</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">🌐</div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Language</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">Hindi & English Dual</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">📊</div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Marking Scheme</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">+1.00 / -0.25 Negative</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="text-2xl mb-1">⚡</div>
              <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Exam Format</span>
              <div className="text-sm font-bold text-slate-900 mt-0.5">TCS iON CBT Pattern</div>
            </div>
          </div>
        </div>
      </section>

      {/* Syllabus / Subject Cards Section */}
      <section className="container mx-auto px-4 sm:px-6 max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100/70 text-blue-700">
            Syllabus Coverage
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Structured Government Exam Modules
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Comprehensive curriculum aligned with RSMSSB Rajasthan Informatics Assistant & State Examination standards.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{sub.icon}</span>
                  <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    {sub.code}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {sub.desc}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-400">{sub.count}</span>
                <Link
                  href="/practice"
                  className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:underline"
                >
                  <span>Practice</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Studio / Sanity Section (Preserved) */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        {settings?.description && (
          <div
            className="prose text-slate-700 mx-auto text-center"
            data-sanity={dataAttr({
              id: settings._id,
              type: 'settings',
              path: 'description',
            }).toString()}
          >
            <PortableText value={settings.description} />
          </div>
        )}

        <Suspense fallback={<div className="text-center text-xs text-slate-400 py-6">Loading announcements...</div>}>
          <AllPosts />
        </Suspense>
      </section>
    </div>
  )
}
