export interface Plan {
  id: string
  name: string
  price: number
  priceId: string
  features: string[]
  limits: {
    pagesPerScan: number
    codeFixesVisible: number | 'unlimited'
    shareableReports: boolean
    complianceBadge: boolean
    rescanIncluded: boolean
    multiSite: number
  }
  popular?: boolean
  oneTime: true
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Scan',
    price: 0,
    priceId: '',
    oneTime: true,
    features: [
      'Scan 1 page',
      'Compliance score',
      'Risk assessment',
      'View 3 issues',
      '1 code fix visible',
    ],
    limits: {
      pagesPerScan: 1,
      codeFixesVisible: 1,
      shareableReports: false,
      complianceBadge: false,
      rescanIncluded: false,
      multiSite: 1,
    },
  },
  {
    id: 'full-report',
    name: 'Full Report',
    price: 49,
    priceId: 'price_full_report',
    popular: true,
    oneTime: true,
    features: [
      'Full site scan (up to 50 pages)',
      'Every issue explained in plain English',
      'Copy-paste code fix for each issue',
      'Prioritized action plan',
      'Cost & time estimate',
      'Shareable report link',
      '1 free re-scan after fixes',
    ],
    limits: {
      pagesPerScan: 50,
      codeFixesVisible: 'unlimited',
      shareableReports: true,
      complianceBadge: false,
      rescanIncluded: true,
      multiSite: 1,
    },
  },
  {
    id: 'agency',
    name: 'Agency Pack',
    price: 199,
    priceId: 'price_agency',
    oneTime: true,
    features: [
      'Everything in Full Report',
      'Scan up to 10 websites',
      'Unlimited pages per site',
      'Compliance badge for each site',
      '3 re-scans per site',
      'Shareable reports for clients',
    ],
    limits: {
      pagesPerScan: 500,
      codeFixesVisible: 'unlimited',
      shareableReports: true,
      complianceBadge: true,
      rescanIncluded: true,
      multiSite: 10,
    },
  },
]

export function getPlan(planId: string): Plan {
  return PLANS.find(p => p.id === planId) || PLANS[0]
}
