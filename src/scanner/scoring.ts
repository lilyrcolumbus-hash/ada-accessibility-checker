import { ScanIssue } from './types'

const SEVERITY_POINTS: Record<string, number> = {
  critical: 10,
  serious: 5,
  moderate: 3,
  minor: 1,
}

const MAX_SCORE = 100
const MAX_PENALTY = 100

export function calculateScore(issues: ScanIssue[], passedChecks: number): number {
  if (issues.length === 0) return MAX_SCORE

  const totalPenalty = issues.reduce((sum, issue) => {
    return sum + (SEVERITY_POINTS[issue.severity] || 1)
  }, 0)

  const normalizedPenalty = Math.min(totalPenalty, MAX_PENALTY)
  const score = MAX_SCORE - normalizedPenalty

  // Bonus for passed checks
  const passedBonus = Math.min(passedChecks * 2, 15)

  return Math.max(0, Math.min(MAX_SCORE, Math.round(score + passedBonus)))
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Needs Improvement'
  if (score >= 30) return 'Poor'
  return 'Critical'
}

export function getScoreColor(score: number): string {
  if (score >= 90) return '#22c55e'
  if (score >= 70) return '#84cc16'
  if (score >= 50) return '#f59e0b'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}
