import { Zap, ArrowRight } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { ScanIssue } from '@/scanner/types'
import { formatTime } from '@/scanner/cost-estimator'

interface PriorityPlanProps {
  issues: ScanIssue[]
  score: number
}

const SEVERITY_POINTS: Record<string, number> = {
  critical: 10,
  serious: 5,
  moderate: 3,
  minor: 1,
}

const SEVERITY_VARIANT = {
  critical: 'critical',
  serious: 'serious',
  moderate: 'moderate',
  minor: 'minor',
} as const

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
}

const STEP_COLORS: Record<string, { bg: string; border: string; num: string; accent: string }> = {
  critical: { bg: 'bg-danger-50', border: 'border-danger-200', num: 'bg-danger-600 text-white', accent: 'text-danger-600' },
  serious: { bg: 'bg-orange-50', border: 'border-orange-200', num: 'bg-orange-500 text-white', accent: 'text-orange-600' },
  moderate: { bg: 'bg-warning-50', border: 'border-warning-200', num: 'bg-warning-500 text-white', accent: 'text-warning-600' },
  minor: { bg: 'bg-blue-50', border: 'border-blue-200', num: 'bg-blue-500 text-white', accent: 'text-blue-600' },
}

export default function PriorityPlan({ issues, score }: PriorityPlanProps) {
  const severityOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }
  const topIssues = [...issues]
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 3)

  const totalScoreImprovement = topIssues.reduce((sum, issue) => {
    return sum + (SEVERITY_POINTS[issue.severity] || 1)
  }, 0)

  const projectedScore = Math.min(100, score + totalScoreImprovement)

  if (topIssues.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with gradient */}
      <div className="px-5 py-4 bg-gradient-to-r from-warning-50 to-orange-50 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-warning-100 rounded-lg">
            <Zap className="w-4 h-4 text-warning-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Priority Action Plan</h3>
            <p className="text-xs text-gray-500">Fix these first for maximum impact</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {topIssues.map((issue, idx) => {
          const points = SEVERITY_POINTS[issue.severity] || 1
          const colors = STEP_COLORS[issue.severity] || STEP_COLORS.minor
          return (
            <div
              key={issue.id}
              className={`flex items-start gap-3 p-3.5 rounded-xl border ${colors.bg} ${colors.border}`}
            >
              {/* Step number */}
              <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${colors.num}`}>
                {idx + 1}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge variant={SEVERITY_VARIANT[issue.severity]}>
                    {SEVERITY_LABEL[issue.severity]}
                  </Badge>
                  <span className="text-xs text-gray-400">~{formatTime(issue.estimatedFixMinutes)}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 leading-snug">{issue.title}</p>
              </div>

              {/* Score improvement */}
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${colors.accent} bg-white border ${colors.border} shadow-sm`}>
                  +{points} pts
                </span>
              </div>
            </div>
          )
        })}

        {/* Score projection */}
        <div className="mt-4 p-4 bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-200 rounded-xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-primary-800">
              Projected score improvement
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-500">{score}</span>
              <ArrowRight className="w-4 h-4 text-primary-500" />
              <span className="text-lg font-extrabold text-primary-700">{projectedScore}</span>
              <span className="text-xs font-bold text-success-600 bg-success-50 px-1.5 py-0.5 rounded">
                +{totalScoreImprovement}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
