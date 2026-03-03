import { ScanResult } from './types'
import { parseHTML } from './parser'
import { ALL_CHECKS } from './checks'
import { calculateScore } from './scoring'

export async function runScan(html: string, url: string): Promise<ScanResult> {
  const startTime = performance.now()
  const doc = parseHTML(html)

  const allIssues = []
  const passedChecks: string[] = []

  for (const check of ALL_CHECKS) {
    try {
      const issues = check.fn(doc, url)
      if (issues.length === 0) {
        passedChecks.push(check.name)
      } else {
        allIssues.push(...issues)
      }
    } catch (e) {
      console.warn(`Check "${check.id}" failed:`, e)
      // Don't break the scan if one check fails
    }
  }

  // Sort by severity: critical > serious > moderate > minor
  const severityOrder = { critical: 0, serious: 1, moderate: 2, minor: 3 }
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  const score = calculateScore(allIssues, passedChecks.length)

  return {
    url,
    scannedAt: new Date().toISOString(),
    score,
    totalIssues: allIssues.length,
    criticalCount: allIssues.filter(i => i.severity === 'critical').length,
    seriousCount: allIssues.filter(i => i.severity === 'serious').length,
    moderateCount: allIssues.filter(i => i.severity === 'moderate').length,
    minorCount: allIssues.filter(i => i.severity === 'minor').length,
    issues: allIssues,
    passedChecks,
    scanDurationMs: Math.round(performance.now() - startTime),
  }
}
