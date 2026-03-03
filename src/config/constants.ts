export const LAWSUIT_STATS = {
  totalLawsuits2023: 4605,
  totalLawsuits2024: 4000,
  h1Lawsuits2025: 2014,
  yearOverYearIncrease: 37,
  smallBusinessPercentage: 67,
  typicalSettlement: { min: 5000, max: 20000 },
  defenseCosts: { min: 50000, max: 100000 },
  websitesNonCompliant: 98,
  deadline: '2026-04-26',
}

export const TOP_LAWSUIT_STATES: Record<string, { lawsuits: number; riskLevel: 'extreme' | 'high' | 'medium' | 'low' }> = {
  'New York': { lawsuits: 2387, riskLevel: 'extreme' },
  'Florida': { lawsuits: 982, riskLevel: 'extreme' },
  'California': { lawsuits: 645, riskLevel: 'high' },
  'Illinois': { lawsuits: 234, riskLevel: 'high' },
  'Pennsylvania': { lawsuits: 178, riskLevel: 'medium' },
  'Texas': { lawsuits: 156, riskLevel: 'medium' },
  'New Jersey': { lawsuits: 143, riskLevel: 'medium' },
  'Massachusetts': { lawsuits: 132, riskLevel: 'medium' },
  'Georgia': { lawsuits: 98, riskLevel: 'medium' },
  'Ohio': { lawsuits: 87, riskLevel: 'medium' },
}

export const INDUSTRY_RISK: Record<string, { multiplier: number; lawsuitCount: number; riskLevel: 'extreme' | 'high' | 'medium' | 'low' }> = {
  'ecommerce': { multiplier: 2.5, lawsuitCount: 1842, riskLevel: 'extreme' },
  'restaurant': { multiplier: 2.0, lawsuitCount: 567, riskLevel: 'high' },
  'healthcare': { multiplier: 1.8, lawsuitCount: 423, riskLevel: 'high' },
  'dental': { multiplier: 1.7, lawsuitCount: 312, riskLevel: 'high' },
  'hotel': { multiplier: 1.9, lawsuitCount: 489, riskLevel: 'high' },
  'education': { multiplier: 1.5, lawsuitCount: 234, riskLevel: 'medium' },
  'legal': { multiplier: 1.3, lawsuitCount: 178, riskLevel: 'medium' },
  'real-estate': { multiplier: 1.6, lawsuitCount: 267, riskLevel: 'medium' },
  'finance': { multiplier: 1.7, lawsuitCount: 345, riskLevel: 'high' },
  'government': { multiplier: 1.4, lawsuitCount: 198, riskLevel: 'medium' },
  'other': { multiplier: 1.0, lawsuitCount: 100, riskLevel: 'low' },
}

export const DEVELOPER_HOURLY_RATE = 50

export const SEVERITY_WEIGHTS = {
  critical: 10,
  serious: 5,
  moderate: 3,
  minor: 1,
} as const

export type Severity = keyof typeof SEVERITY_WEIGHTS
