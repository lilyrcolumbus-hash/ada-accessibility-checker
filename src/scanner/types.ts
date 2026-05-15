let _counter = 0
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${++_counter}`
}

export type Severity = 'critical' | 'serious' | 'moderate' | 'minor'

export interface ScanIssue {
  id: string
  checkId: string
  severity: Severity
  title: string
  description: string
  element: string
  selector: string
  wcagCriteria: string
  wcagLevel: 'A' | 'AA' | 'AAA'
  fixDescription: string
  codeBefore: string
  codeAfter: string
  estimatedFixMinutes: number
  category: string
  // Multi-page scan: the page where this issue was found. Absent for legacy single-page scans.
  pageUrl?: string
}

export interface PageScanError {
  url: string
  error: string
}

export interface ScanResult {
  url: string
  scannedAt: string
  score: number
  totalIssues: number
  criticalCount: number
  seriousCount: number
  moderateCount: number
  minorCount: number
  issues: ScanIssue[]
  passedChecks: string[]
  scanDurationMs: number
  // Multi-page scan metadata. Undefined or 1 means legacy single-page result.
  pagesScanned?: number
  pagesAttempted?: number
  pageErrors?: PageScanError[]
}

export interface RiskAssessment {
  overallRisk: 'extreme' | 'high' | 'medium' | 'low'
  industryRisk: string
  stateRisk: string
  estimatedLiability: { min: number; max: number }
  lawsuitProbability: string
  industryLawsuits: number
  stateLawsuits: number
}

export interface CostEstimate {
  totalMinutes: number
  totalHours: number
  totalCost: number
  byCategory: Record<string, { minutes: number; cost: number; issues: number }>
}

export interface ColorSuggestion {
  original: string
  suggested: string
  contrastRatio: number
  meetsAA: boolean
  meetsAAA: boolean
}

export type CheckFunction = (doc: Document, url: string) => ScanIssue[]
