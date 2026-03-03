import { useState } from 'react'
import { ListChecks } from 'lucide-react'
import { cn } from '@/lib/utils'
import IssueCard from './IssueCard'
import UpgradePrompt from './UpgradePrompt'
import type { ScanIssue, Severity } from '@/scanner/types'

interface IssuesListProps {
  issues: ScanIssue[]
  isPaid: boolean
}

type FilterOption = 'all' | Severity

const FREE_VISIBLE_COUNT = 3

const FILTER_CONFIG: Record<Exclude<FilterOption, 'all'>, { label: string; dot: string; active: string }> = {
  critical: { label: 'Critical', dot: 'bg-danger-500', active: 'bg-danger-50 text-danger-700 border-danger-300 ring-1 ring-danger-200' },
  serious: { label: 'Serious', dot: 'bg-orange-500', active: 'bg-orange-50 text-orange-700 border-orange-300 ring-1 ring-orange-200' },
  moderate: { label: 'Moderate', dot: 'bg-warning-500', active: 'bg-warning-50 text-warning-700 border-warning-300 ring-1 ring-warning-200' },
  minor: { label: 'Minor', dot: 'bg-blue-500', active: 'bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-200' },
}

export default function IssuesList({ issues, isPaid }: IssuesListProps) {
  const [filter, setFilter] = useState<FilterOption>('all')

  const counts: Record<Severity, number> = {
    critical: issues.filter(i => i.severity === 'critical').length,
    serious: issues.filter(i => i.severity === 'serious').length,
    moderate: issues.filter(i => i.severity === 'moderate').length,
    minor: issues.filter(i => i.severity === 'minor').length,
  }

  const filteredIssues = filter === 'all' ? issues : issues.filter(i => i.severity === filter)

  const visibleIssues = isPaid ? filteredIssues : filteredIssues.slice(0, FREE_VISIBLE_COUNT)
  const blurredIssues = isPaid ? [] : filteredIssues.slice(FREE_VISIBLE_COUNT, FREE_VISIBLE_COUNT + 2)
  const hiddenCount = isPaid ? 0 : Math.max(0, filteredIssues.length - FREE_VISIBLE_COUNT)

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <ListChecks className="w-4 h-4 text-gray-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Issues Found
              <span className="ml-2 text-sm font-normal text-gray-400">({issues.length})</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Severity summary chips */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(counts) as [Severity, number][]).map(([severity, count]) => {
          if (count === 0) return null
          const config = FILTER_CONFIG[severity]
          return (
            <span key={severity} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700">
              <span className={cn('w-2 h-2 rounded-full', config.dot)} />
              {count} {config.label}
            </span>
          )
        })}
      </div>

      {/* Filter buttons */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilter('all')}
          className={cn(
            'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
            filter === 'all'
              ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          )}
        >
          All ({issues.length})
        </button>
        {(Object.entries(FILTER_CONFIG) as [Severity, typeof FILTER_CONFIG['critical']][]).map(([severity, config]) => {
          const count = counts[severity]
          if (count === 0) return null
          const isActive = filter === severity
          return (
            <button
              key={severity}
              onClick={() => setFilter(severity)}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5',
                isActive ? config.active : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              )}
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Issue cards */}
      <div className="space-y-3">
        {visibleIssues.length === 0 && blurredIssues.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">
            No {filter !== 'all' ? filter : ''} issues found.
          </div>
        ) : (
          <>
            {visibleIssues.map(issue => (
              <IssueCard key={issue.id} issue={issue} isBlurred={false} />
            ))}

            {/* Blurred preview issues */}
            {blurredIssues.map(issue => (
              <IssueCard key={issue.id} issue={issue} isBlurred={true} />
            ))}

            {/* Upgrade CTA for hidden issues */}
            {hiddenCount > 0 && (
              <UpgradePrompt hiddenIssueCount={hiddenCount} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
