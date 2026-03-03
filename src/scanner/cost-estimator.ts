import { CostEstimate, ScanIssue } from './types'
import { DEVELOPER_HOURLY_RATE } from '../config/constants'

export function estimateCosts(issues: ScanIssue[]): CostEstimate {
  const byCategory: CostEstimate['byCategory'] = {}

  for (const issue of issues) {
    if (!byCategory[issue.category]) {
      byCategory[issue.category] = { minutes: 0, cost: 0, issues: 0 }
    }
    byCategory[issue.category].minutes += issue.estimatedFixMinutes
    byCategory[issue.category].issues += 1
  }

  // Calculate costs per category
  for (const cat of Object.values(byCategory)) {
    cat.cost = Math.round((cat.minutes / 60) * DEVELOPER_HOURLY_RATE)
  }

  const totalMinutes = issues.reduce((sum, i) => sum + i.estimatedFixMinutes, 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const totalCost = Math.round(totalHours * DEVELOPER_HOURLY_RATE)

  return { totalMinutes, totalHours, totalCost, byCategory }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
