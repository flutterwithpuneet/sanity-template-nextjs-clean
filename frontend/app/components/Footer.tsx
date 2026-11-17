import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              EF
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block">
                ExamForge Platform
              </span>
              <span className="text-xs text-slate-500">
                Government Exam Question Bank & Practice Test Series
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-300">
            <Link href="/practice" className="hover:text-white transition-colors">
              Practice Tests
            </Link>
            <Link href="/admin/questions" className="hover:text-white transition-colors">
              Question Bank
            </Link>
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin Dashboard
            </Link>
            <Link href="/admin/settings" className="hover:text-white transition-colors">
              Settings
            </Link>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>© {new Date().getFullYear()} ExamForge. Prepared for Rajasthan Informatics Assistant (सूचना सहायक) & State Examinations.</p>
          <p className="text-[11px] font-mono text-slate-600">Built with Next.js 16 • TiDB Cloud PostgreSQL</p>
        </div>
      </div>
    </footer>
  )
}
