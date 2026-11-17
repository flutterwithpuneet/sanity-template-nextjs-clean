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
    <header className="fixed z-50 h-20 inset-x-0 top-0 bg-neutral-950/90 backdrop-blur-md border-b border-neutral-800 flex items-center shadow-lg text-white">
      <div className="container py-4 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="flex items-center justify-between gap-5">
          <Link className="flex items-center gap-2.5 group" href="/">
            <div className="w-9 h-9 rounded-xl bg-white text-black font-black text-sm flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
              EF
            </div>
            <span className="text-lg sm:text-xl font-extrabold tracking-tight text-white group-hover:text-neutral-300 transition-colors">
              ExamForge
            </span>
          </Link>

          <nav>
            <ul
              role="list"
              className="flex items-center gap-3 sm:gap-5 leading-5 text-xs sm:text-sm font-semibold text-neutral-300"
            >
              <li>
                <Link
                  href="/practice"
                  className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                >
                  <span>Practice Tests</span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-black"></span>
                </Link>
              </li>

              <li className="hidden sm:block">
                <Link
                  href="/admin/questions"
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  Question Bank
                </Link>
              </li>

              <li>
                <Link
                  href="/admin"
                  className="px-3.5 py-2 rounded-xl bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-white text-xs font-bold transition-colors"
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
