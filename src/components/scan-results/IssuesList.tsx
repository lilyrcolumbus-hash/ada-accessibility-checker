import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListChecks, ChevronDown, ChevronRight, Lock, FileText, ShieldCheck, RotateCcw, ChevronRight as ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import IssueCard from './IssueCard'
import Button from '@/components/ui/Button'
import { FREE_ISSUES_VISIBLE } from '@/config/plans'
import type { ScanIssue, Severity } from '@/scanner/types'

interface IssuesListProps {
  issues: ScanIssue[]
  isPaid: boolean
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

// Pick N free issues: prioritize by severity, deduplicate by title so user sees variety
function getFreeIssueIds(issues: ScanIssue[], limit: number): Set<string> {
  const order: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 }
  const sorted = [...issues].sort((a, b) => (order[a.severity] ?? 4) - (order[b.severity] ?? 4))

  const picked: string[] = []
  const seenTitles = new Set<string>()

  // First pass: pick one of each unique title (most severe first)
  for (const issue of sorted) {
    if (picked.length >= limit) break
    if (!seenTitles.has(issue.title)) {
      seenTitles.add(issue.title)
      picked.push(issue.id)
    }
  }

  // Second pass: if we still need more, fill with remaining by severity
  if (picked.length < limit) {
    const pickedSet = new Set(picked)
    for (const issue of sorted) {
      if (picked.length >= limit) break
      if (!pickedSet.has(issue.id)) {
        picked.push(issue.id)
        pickedSet.add(issue.id)
      }
    }
  }

  return new Set(picked)
}

export default function IssuesList({ issues, isPaid }: IssuesListProps) {
  const groups = groupBySeverity(issues)
  const navigate = useNavigate()
  const { user } = useAuth()
  const checkoutPath = user ? '/checkout?plan=fix-my-site' : '/register?plan=fix-my-site'

  const freeIds = isPaid ? null : getFreeIssueIds(issues, FREE_ISSUES_VISIBLE)
  const hiddenCount = isPaid ? 0 : Math.max(0, issues.length - FREE_ISSUES_VISIBLE)

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
            {!isPaid && hiddenCount > 0 && (
              <p className="text-xs text-gray-500 mt-0.5">
                Showing top {FREE_ISSUES_VISIBLE} most critical · <span className="font-semibold text-primary-600">{hiddenCount} more hidden</span>
              </p>
            )}
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

          // Filter: only show free issues for non-paid users
          const visibleIssues = isPaid
            ? groupIssues
            : groupIssues.filter(i => freeIds!.has(i.id))
          const lockedInGroup = isPaid ? 0 : groupIssues.length - visibleIssues.length

          if (visibleIssues.length === 0 && !isPaid) {
            // Entire group is locked — show locked header
            return (
              <div key={severity} className={cn('rounded-xl border overflow-hidden opacity-60', config.border)}>
                <div className={cn('flex items-center justify-between px-4 py-3', config.bg)}>
                  <div className="flex items-center gap-2.5">
                    <span className={cn('w-2.5 h-2.5 rounded-full', config.dot)} />
                    <span className={cn('text-sm font-bold', config.text)}>{config.label}</span>
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full bg-white/70', config.text)}>
                      {groupIssues.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Lock className="w-3 h-3" />
                    Upgrade to view
                  </div>
                </div>
              </div>
            )
          }

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
                  {visibleIssues.map(issue => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                  {lockedInGroup > 0 && (
                    <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{lockedInGroup} more {config.label.toLowerCase()} issue{lockedInGroup !== 1 ? 's' : ''} — upgrade to view</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Upgrade CTA for free users */}
        {!isPaid && hiddenCount > 0 && (
          <div className="rounded-xl border-2 border-primary-300 bg-gradient-to-br from-primary-50 via-white to-primary-50 p-5 space-y-4">
            <div className="text-center">
              <p className="text-lg font-extrabold text-gray-900">
                {hiddenCount} more issue{hiddenCount !== 1 ? 's' : ''} found on your site
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Get all fixes + your Accessibility Audit Report to prove compliance
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { Icon: FileText, text: 'Audit Report PDF' },
                { Icon: ShieldCheck, text: '"ADA Tested" badge' },
                { Icon: RotateCcw, text: 'Re-scan to verify' },
              ].map(({ Icon, text }) => (
                <div key={text} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-primary-200">
                  <Icon className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <span className="text-xs font-medium text-gray-700">{text}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-primary-200">
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-extrabold text-gray-900">$49</span>
                  <span className="text-sm text-gray-500">one-time</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">vs average lawsuit</p>
                <p className="text-sm font-bold text-danger-600">$10,000+</p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full gap-2"
              onClick={() => {
                sessionStorage.setItem('sitesafe_pending_plan', 'fix-my-site')
                navigate(checkoutPath)
              }}
            >
              Unlock All Issues + Audit Report
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-center text-gray-400">One-time payment. No subscription.</p>
          </div>
        )}
      </div>
    </div>
  )
}
