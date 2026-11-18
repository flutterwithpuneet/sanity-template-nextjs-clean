import React from 'react'

interface MetricCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  iconBgColor?: string
  trend?: string
  trendPositive?: boolean
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = 'bg-[#151515] border border-[#262626] text-[#FAFAFA]',
  trend,
  trendPositive = true,
}: MetricCardProps) {
  return (
    <div className="bg-[#111111] rounded-2xl border border-[#262626] p-5 hover:border-[#3F3F46] hover:bg-[#151515]/50 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-mono font-medium text-[#71717A] uppercase tracking-wider">
            {title}
          </p>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#FAFAFA] tracking-tight">
            {value}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor}`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-[#1F1F1F] flex items-center justify-between text-xs">
          {subtitle && <span className="text-[#71717A] text-[11px]">{subtitle}</span>}
          {trend && (
            <span
              className={`font-mono text-[11px] font-semibold ${
                trendPositive ? 'text-[#FAFAFA]' : 'text-[#A1A1AA]'
              }`}
            >
              {trend}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
