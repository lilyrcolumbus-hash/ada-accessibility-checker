import { useState } from 'react'
import { ListChecks, ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import IssueCard from './IssueCard'
import type { ScanIssue, Severity } from '@/scanner/types'

interface IssuesListProps {
  issues: ScanIssue[]
}

const SEVERITY_ORDER: Severity[] = ['critical', 'serious', 'moderate', 'minor']

const SEVERITY_CONFIG: Record<Severity, { label: string; dot: string; bg: string; text: string; border: string }> = {
  critical: { label: 'Critical', dot: 'bg-danger-500', bg: 'bg-danger-50', text: 'text-danger-700', border: 'border-danger-200' },
  serious: { label: 'Serious', dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  moderate: { label: 'Moderate', dot: 'bg-warning-500', bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-warning-200' },
  minor: { label: 'Minor', dot: 'bg-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
}

function groupBySeverity(issues: ScanIssue[]): Record<Severity, ScanIssue[]> {
  const groups: Record<Severity, ScanIssue[]> = { critical: [], serious: [], moderate: [], minor: [] }
  for (const issue of issues) {
    groups[issue.severity].push(issue)
  }
  return groups
}

export default function IssuesList({ issues }: IssuesListProps) {
  const groups = groupBySeverity(issues)

  // Critical starts expanded, rest collapsed
  const [expandedGroups, setExpandedGroups] = useState<Record<Severity, boolean>>({
    critical: true,
    serious: false,
    moderate: false,
    minor: false,
  })

  const toggleGroup = (severity: Severity) => {
    setExpandedGroups(prev => ({ ...prev, [severity]: !prev[severity] }))
  }

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
        {SEVERITY_ORDER.map(severity => {
          const count = groups[severity].length
          if (count === 0) return null
          const config = SEVERITY_CONFIG[severity]
          return (
            <span key={severity} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 border border-gray-200 text-gray-700">
              <span className={cn('w-2 h-2 rounded-full', config.dot)} />
              {count} {config.label}
            </span>
          )
        })}
      </div>

      {/* Severity groups */}
      <div className="space-y-3">
        {SEVERITY_ORDER.map(severity => {
          const groupIssues = groups[severity]
          if (groupIssues.length === 0) return null
          const config = SEVERITY_CONFIG[severity]
          const isExpanded = expandedGroups[severity]

          return (
            <div key={severity} className={cn('rounded-xl border overflow-hidden', config.border)}>
              {/* Group header — clickable */}
              <button
                onClick={() => toggleGroup(severity)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 transition-colors',
                  config.bg,
                  'hover:opacity-80',
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn('w-2.5 h-2.5 rounded-full', config.dot)} />
                  <span className={cn('text-sm font-bold', config.text)}>
                    {config.label}
                  </span>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70', config.text)}>
                    {groupIssues.length}
                  </span>
                </div>
                {isExpanded
                  ? <ChevronDown className={cn('w-4 h-4', config.text)} />
                  : <ChevronRight className={cn('w-4 h-4', config.text)} />}
              </button>

              {/* Issues within group */}
              {isExpanded && (
                <div className="p-3 space-y-3 bg-white">
                  {groupIssues.map(issue => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              )}
            </div>
          )
        })}

      </div>
    </div>
  )
}
