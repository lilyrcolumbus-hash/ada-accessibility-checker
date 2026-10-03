export const LAWSUIT_STATS = {
  totalLawsuits2023: 4605,
  totalLawsuits2024: 4000,
  h1Lawsuits2025: 2014,
  yearOverYearIncrease: 37,
  smallBusinessPercentage: 67,
  typicalSettlement: { min: 5000, max: 20000 },
  defenseCosts: { min: 50000, max: 100000 },
  websitesNonCompliant: 98,
}

// 2025 counts for California, Florida, Illinois, Minnesota, New York, and
// Pennsylvania were refreshed 2026-08-18 against real 2025 filing data
// (adatitleiii.com "Federal Court Website Accessibility Lawsuit Filings
// Bounce Back in 2025" + EcomBack's 2025 annual report) — the old numbers
// were stale enough to misrepresent which states are actually surging
// (Illinois 5x'd, Florida nearly doubled, Minnesota entered the top 5) vs.
// saturated (New York). The other 44 states are untouched — not verified
// against a 2025 source, left as prior placeholder estimates.
export const TOP_LAWSUIT_STATES: Record<string, { lawsuits: number; riskLevel: 'extreme' | 'high' | 'medium' | 'low' }> = {
  'Alabama': { lawsuits: 32, riskLevel: 'low' },
  'Alaska': { lawsuits: 8, riskLevel: 'low' },
  'Arizona': { lawsuits: 54, riskLevel: 'low' },
  'Arkansas': { lawsuits: 18, riskLevel: 'low' },
  'California': { lawsuits: 787, riskLevel: 'extreme' },
  'Colorado': { lawsuits: 62, riskLevel: 'medium' },
  'Connecticut': { lawsuits: 78, riskLevel: 'medium' },
  'Delaware': { lawsuits: 22, riskLevel: 'low' },
  'Florida': { lawsuits: 961, riskLevel: 'extreme' },
  'Georgia': { lawsuits: 98, riskLevel: 'medium' },
  'Hawaii': { lawsuits: 12, riskLevel: 'low' },
  'Idaho': { lawsuits: 10, riskLevel: 'low' },
  'Illinois': { lawsuits: 576, riskLevel: 'extreme' },
  'Indiana': { lawsuits: 42, riskLevel: 'low' },
  'Iowa': { lawsuits: 20, riskLevel: 'low' },
  'Kansas': { lawsuits: 24, riskLevel: 'low' },
  'Kentucky': { lawsuits: 28, riskLevel: 'low' },
  'Louisiana': { lawsuits: 36, riskLevel: 'low' },
  'Maine': { lawsuits: 14, riskLevel: 'low' },
  'Maryland': { lawsuits: 68, riskLevel: 'medium' },
  'Massachusetts': { lawsuits: 132, riskLevel: 'medium' },
  'Michigan': { lawsuits: 72, riskLevel: 'medium' },
  'Minnesota': { lawsuits: 162, riskLevel: 'high' },
  'Mississippi': { lawsuits: 16, riskLevel: 'low' },
  'Missouri': { lawsuits: 44, riskLevel: 'low' },
  'Montana': { lawsuits: 8, riskLevel: 'low' },
  'Nebraska': { lawsuits: 14, riskLevel: 'low' },
  'Nevada': { lawsuits: 48, riskLevel: 'low' },
  'New Hampshire': { lawsuits: 12, riskLevel: 'low' },
  'New Jersey': { lawsuits: 143, riskLevel: 'medium' },
  'New Mexico': { lawsuits: 16, riskLevel: 'low' },
  'New York': { lawsuits: 1021, riskLevel: 'extreme' },
  'North Carolina': { lawsuits: 64, riskLevel: 'medium' },
  'North Dakota': { lawsuits: 6, riskLevel: 'low' },
  'Ohio': { lawsuits: 87, riskLevel: 'medium' },
  'Oklahoma': { lawsuits: 26, riskLevel: 'low' },
  'Oregon': { lawsuits: 52, riskLevel: 'low' },
  'Pennsylvania': { lawsuits: 137, riskLevel: 'medium' },
  'Rhode Island': { lawsuits: 18, riskLevel: 'low' },
  'South Carolina': { lawsuits: 34, riskLevel: 'low' },
  'South Dakota': { lawsuits: 6, riskLevel: 'low' },
  'Tennessee': { lawsuits: 46, riskLevel: 'low' },
  'Texas': { lawsuits: 156, riskLevel: 'medium' },
  'Utah': { lawsuits: 28, riskLevel: 'low' },
  'Vermont': { lawsuits: 8, riskLevel: 'low' },
  'Virginia': { lawsuits: 74, riskLevel: 'medium' },
  'Washington': { lawsuits: 66, riskLevel: 'medium' },
  'West Virginia': { lawsuits: 10, riskLevel: 'low' },
  'Wisconsin': { lawsuits: 38, riskLevel: 'low' },
  'Wyoming': { lawsuits: 4, riskLevel: 'low' },
}

export const INDUSTRY_RISK: Record<string, { multiplier: number; lawsuitCount: number; riskLevel: 'extreme' | 'high' | 'medium' | 'low' }> = {
  'ecommerce': { multiplier: 2.5, lawsuitCount: 1842, riskLevel: 'extreme' },
  'retail': { multiplier: 2.2, lawsuitCount: 1245, riskLevel: 'extreme' },
  'restaurant': { multiplier: 2.0, lawsuitCount: 567, riskLevel: 'high' },
  'food-delivery': { multiplier: 1.9, lawsuitCount: 412, riskLevel: 'high' },
  'hotel': { multiplier: 1.9, lawsuitCount: 489, riskLevel: 'high' },
  'travel': { multiplier: 1.8, lawsuitCount: 378, riskLevel: 'high' },
  'healthcare': { multiplier: 1.8, lawsuitCount: 423, riskLevel: 'high' },
  'dental': { multiplier: 1.7, lawsuitCount: 312, riskLevel: 'high' },
  'pharmacy': { multiplier: 1.7, lawsuitCount: 298, riskLevel: 'high' },
  'finance': { multiplier: 1.7, lawsuitCount: 345, riskLevel: 'high' },
  'banking': { multiplier: 1.7, lawsuitCount: 334, riskLevel: 'high' },
  'insurance': { multiplier: 1.6, lawsuitCount: 287, riskLevel: 'medium' },
  'real-estate': { multiplier: 1.6, lawsuitCount: 267, riskLevel: 'medium' },
  'automotive': { multiplier: 1.6, lawsuitCount: 256, riskLevel: 'medium' },
  'fitness': { multiplier: 1.5, lawsuitCount: 234, riskLevel: 'medium' },
  'salon-spa': { multiplier: 1.5, lawsuitCount: 223, riskLevel: 'medium' },
  'education': { multiplier: 1.5, lawsuitCount: 234, riskLevel: 'medium' },
  'entertainment': { multiplier: 1.5, lawsuitCount: 245, riskLevel: 'medium' },
  'media': { multiplier: 1.4, lawsuitCount: 212, riskLevel: 'medium' },
  'government': { multiplier: 1.4, lawsuitCount: 198, riskLevel: 'medium' },
  'nonprofit': { multiplier: 1.4, lawsuitCount: 189, riskLevel: 'medium' },
  'legal': { multiplier: 1.3, lawsuitCount: 178, riskLevel: 'medium' },
  'accounting': { multiplier: 1.3, lawsuitCount: 156, riskLevel: 'medium' },
  'construction': { multiplier: 1.2, lawsuitCount: 134, riskLevel: 'low' },
  'manufacturing': { multiplier: 1.2, lawsuitCount: 145, riskLevel: 'low' },
  'technology': { multiplier: 1.1, lawsuitCount: 123, riskLevel: 'low' },
  'consulting': { multiplier: 1.1, lawsuitCount: 112, riskLevel: 'low' },
  'agriculture': { multiplier: 1.0, lawsuitCount: 67, riskLevel: 'low' },
  'other': { multiplier: 1.0, lawsuitCount: 100, riskLevel: 'low' },
}

export const DEVELOPER_HOURLY_RATE = 50

export const SEVERITY_WEIGHTS = {
  critical: 10,
  serious: 5,
  moderate: 3,
  minor: 1,
} as const

// Severity type is defined in scanner/types.ts — use that as single source of truth
