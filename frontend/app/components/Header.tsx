import Link from 'next/link'
import {settingsQuery} from '@/sanity/lib/queries'
import {sanityFetch} from '@/sanity/lib/live'

export default async function Header() {
  let settings: any = null
  try {
    const res = await sanityFetch({
      query: settingsQuery,
    })
    settings = res.data
  } catch {
    // Fallback when Sanity is not connected
  }

  return (
    <header className="fixed z-50 h-20 inset-x-0 top-0 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center shadow-2xs">
      <div className="container py-4 px-4 sm:px-6">
        <div className="flex items-center justify-between gap-5">
          <Link className="flex items-center gap-2.5 group" href="/">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              EF
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              ExamForge
            </span>
          </Link>

          <nav>
            <ul
              role="list"
              className="flex items-center gap-3 sm:gap-5 leading-5 text-xs sm:text-sm font-semibold text-slate-600"
            >
              <li>
                <Link
                  href="/practice"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
                >
                  <span>Practice Tests</span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
                </Link>
              </li>

              <li className="hidden sm:block">
                <Link
                  href="/admin/questions"
                  className="text-slate-600 hover:text-blue-600 transition-colors"
                >
                  Question Bank
                </Link>
              </li>

              <li>
                <Link
                  href="/admin"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition-colors"
                >
                  Admin Panel
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}
