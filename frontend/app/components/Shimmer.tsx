import React from 'react'

export function Shimmer({ className = '' }: { className?: string }) {
  return <div className={`shimmer rounded-lg ${className}`} />
}

/**
 * Skeleton for Practice Test Catalog (/practice)
 */
export function TestCatalogSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl bg-white border border-gray-200 p-6 shadow-xs flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Shimmer className="w-16 h-5 rounded" />
              <Shimmer className="w-14 h-4 rounded" />
            </div>

            <div className="space-y-2 pt-1">
              <Shimmer className="w-4/5 h-5 rounded" />
              <Shimmer className="w-3/5 h-5 rounded" />
            </div>

            <div className="space-y-1.5 pt-1">
              <Shimmer className="w-full h-3 rounded" />
              <Shimmer className="w-2/3 h-3 rounded" />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="space-y-1 flex flex-col items-center">
                <Shimmer className="w-8 h-4 rounded" />
                <Shimmer className="w-12 h-2.5 rounded" />
              </div>
              <div className="space-y-1 flex flex-col items-center">
                <Shimmer className="w-8 h-4 rounded" />
                <Shimmer className="w-10 h-2.5 rounded" />
              </div>
              <div className="space-y-1 flex flex-col items-center">
                <Shimmer className="w-8 h-4 rounded" />
                <Shimmer className="w-10 h-2.5 rounded" />
              </div>
            </div>

            <Shimmer className="w-full h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for Question Bank (/admin/questions)
 */
export function QuestionBankSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shimmer className="w-20 h-5 rounded-full" />
              <Shimmer className="w-24 h-5 rounded-full" />
              <Shimmer className="w-16 h-5 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Shimmer className="w-8 h-8 rounded-lg" />
              <Shimmer className="w-8 h-8 rounded-lg" />
            </div>
          </div>

          <div className="space-y-2">
            <Shimmer className="w-11/12 h-5 rounded" />
            <Shimmer className="w-3/4 h-5 rounded" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                <Shimmer className="w-6 h-6 rounded-full shrink-0" />
                <Shimmer className="w-4/5 h-4 rounded" />
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
            <Shimmer className="w-48 h-3.5 rounded" />
            <Shimmer className="w-20 h-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Generic Table Skeleton for Admin lists (Exams, Students, Admins, Reports, Mock Tests)
 */
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs animate-pulse">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Shimmer key={i} className="h-4 w-3/4 rounded" />
        ))}
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 grid gap-4 items-center" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <Shimmer key={c} className={`h-4 rounded ${c === 0 ? 'w-4/5 font-semibold' : 'w-2/3'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Cards Grid Skeleton (Subjects, Topics)
 */
export function CardsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <Shimmer className="w-10 h-10 rounded-xl" />
            <Shimmer className="w-16 h-5 rounded-full" />
          </div>
          <div className="space-y-2">
            <Shimmer className="w-3/4 h-5 rounded" />
            <Shimmer className="w-full h-3.5 rounded" />
            <Shimmer className="w-2/3 h-3.5 rounded" />
          </div>
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <Shimmer className="w-20 h-4 rounded" />
            <Shimmer className="w-16 h-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for Live Exam Portal (/practice/[id])
 */
export function ExamPortalSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/60 p-4 md:p-6 space-y-6 animate-pulse max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="rounded-2xl bg-white border border-gray-200 p-4 flex items-center justify-between shadow-xs">
        <div className="space-y-1.5">
          <Shimmer className="w-48 h-5 rounded" />
          <Shimmer className="w-32 h-3.5 rounded" />
        </div>
        <div className="flex items-center gap-3">
          <Shimmer className="w-24 h-9 rounded-xl" />
          <Shimmer className="w-24 h-9 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Question Area */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <Shimmer className="w-28 h-6 rounded-md" />
              <Shimmer className="w-20 h-4 rounded" />
            </div>

            <div className="space-y-2.5">
              <Shimmer className="w-full h-5 rounded" />
              <Shimmer className="w-11/12 h-5 rounded" />
              <Shimmer className="w-3/4 h-5 rounded" />
            </div>

            <div className="space-y-3 pt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50/40">
                  <Shimmer className="w-5 h-5 rounded-full shrink-0" />
                  <Shimmer className="w-4/5 h-4 rounded" />
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
              <Shimmer className="w-28 h-10 rounded-xl" />
              <div className="flex items-center gap-3">
                <Shimmer className="w-24 h-10 rounded-xl" />
                <Shimmer className="w-28 h-10 rounded-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-5 space-y-4 shadow-xs">
            <Shimmer className="w-36 h-5 rounded" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 15 }).map((_, i) => (
                <Shimmer key={i} className="w-full aspect-square rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for Result Breakdown (/practice/result/[attemptId])
 */
export function ResultPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 animate-pulse">
      {/* Top Banner Card */}
      <div className="rounded-3xl bg-white border border-gray-200 p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Shimmer className="w-28 h-5 rounded-full" />
            <Shimmer className="w-72 h-7 rounded" />
            <Shimmer className="w-48 h-4 rounded" />
          </div>
          <Shimmer className="w-32 h-10 rounded-xl" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
              <Shimmer className="w-16 h-3 rounded" />
              <Shimmer className="w-20 h-6 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Questions Breakdown Skeleton */}
      <div className="space-y-4">
        <Shimmer className="w-44 h-6 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white border border-gray-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <Shimmer className="w-24 h-5 rounded-full" />
              <Shimmer className="w-16 h-4 rounded" />
            </div>
            <Shimmer className="w-5/6 h-5 rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center gap-2">
                  <Shimmer className="w-5 h-5 rounded-full" />
                  <Shimmer className="w-3/4 h-3.5 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for Admin Dashboard Stats (/admin)
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white border border-gray-200 p-5 space-y-2 shadow-xs">
          <Shimmer className="w-16 h-3 rounded" />
          <Shimmer className="w-12 h-7 rounded" />
          <Shimmer className="w-20 h-3 rounded" />
        </div>
      ))}
    </div>
  )
}
