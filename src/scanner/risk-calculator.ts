import { RiskAssessment, ScanIssue } from './types'
import { INDUSTRY_RISK, TOP_LAWSUIT_STATES, LAWSUIT_STATS } from '../config/constants'

export function calculateRisk(
  issues: ScanIssue[],
  industry: string = 'other',
  state: string = ''
): RiskAssessment {
  const industryData = INDUSTRY_RISK[industry] || INDUSTRY_RISK['other']
  const stateData = state ? TOP_LAWSUIT_STATES[state] : null

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const seriousCount = issues.filter(i => i.severity === 'serious').length
  const moderateCount = issues.filter(i => i.severity === 'moderate').length
  const minorCount = issues.filter(i => i.severity === 'minor').length

  // Base risk from issues (all severities contribute)
  let riskScore = criticalCount * 3 + seriousCount * 2 + moderateCount * 0.5 + minorCount * 0.1

  // Apply industry multiplier
  riskScore *= industryData.multiplier

  // Apply state multiplier
  if (stateData) {
    const stateMultiplier = stateData.riskLevel === 'extreme' ? 2.0
      : stateData.riskLevel === 'high' ? 1.5
      : stateData.riskLevel === 'medium' ? 1.2
      : 1.0
    riskScore *= stateMultiplier
  }

  const overallRisk: RiskAssessment['overallRisk'] =
    riskScore >= 20 ? 'extreme'
    : riskScore >= 12 ? 'high'
    : riskScore >= 6 ? 'medium'
    : 'low'

  const baseMin = LAWSUIT_STATS.typicalSettlement.min
  const baseMax = LAWSUIT_STATS.typicalSettlement.max

  return {
    overallRisk,
    industryRisk: industryData.riskLevel,
    stateRisk: stateData?.riskLevel || 'unknown',
    estimatedLiability: {
      min: Math.round(baseMin * industryData.multiplier),
      max: Math.round(baseMax * industryData.multiplier),
    },
    lawsuitProbability: overallRisk === 'extreme' ? 'Very High'
      : overallRisk === 'high' ? 'High'
      : overallRisk === 'medium' ? 'Moderate'
      : 'Low',
    industryLawsuits: industryData.lawsuitCount,
    stateLawsuits: stateData?.lawsuits || 0,
  }
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case 'extreme': return '#dc2626'
    case 'high': return '#f97316'
    case 'medium': return '#f59e0b'
    case 'low': return '#22c55e'
    default: return '#6b7280'
  }
}
