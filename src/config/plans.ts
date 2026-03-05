export interface Plan {
  id: string
  name: string
  tagline: string
  price: number
  priceId: string
  billing: 'free' | 'one-time' | 'yearly'
  features: string[]
  limits: {
    pagesPerScan: number
    codeFixesVisible: number | 'unlimited'
    shareableReports: boolean
    complianceBadge: boolean
    rescanIncluded: boolean | 'unlimited'
    monthlyAutoScan: boolean
    emailAlerts: boolean
    multiSite: number
  }
  popular?: boolean
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Scan',
    tagline: 'See what\'s broken',
    price: 0,
    priceId: '',
    billing: 'free',
    features: [
      'Scan 1 page',
      'Compliance score & risk level',
      'View all issues found',
      '1 code fix included',
    ],
    limits: {
      pagesPerScan: 1,
      codeFixesVisible: 1,
      shareableReports: false,
      complianceBadge: false,
      rescanIncluded: false,
      monthlyAutoScan: false,
      emailAlerts: false,
      multiSite: 1,
    },
  },
  {
    id: 'fix-my-site',
    name: 'Fix My Site',
    tagline: 'Fix it before they sue you',
    price: 49,
    priceId: 'price_1T7MPaFfYL1pGw0ot4eQO3Bp',
    billing: 'one-time',
    popular: true,
    features: [
      'Scan up to 50 pages',
      'All code fixes (copy-paste ready)',
      'Prioritized action plan',
      'Shareable report link',
      'Cost & time estimates',
      '1 re-scan after fixes',
    ],
    limits: {
      pagesPerScan: 50,
      codeFixesVisible: 'unlimited',
      shareableReports: true,
      complianceBadge: false,
      rescanIncluded: true,
      monthlyAutoScan: false,
      emailAlerts: false,
      multiSite: 1,
    },
  },
  {
    id: 'compliance-shield',
    name: 'Compliance Shield',
    tagline: 'Never worry about a lawsuit again',
    price: 199,
    priceId: 'price_1T7MiPFfYL1pGw0ohwz2MHvV',
    billing: 'yearly',
    features: [
      'Everything in Fix My Site',
      'Up to 5 websites',
      'Unlimited re-scans',
      'Monthly automated re-scans',
      'Email alerts if score drops',
      'Compliance badge for your site',
    ],
    limits: {
      pagesPerScan: 50,
      codeFixesVisible: 'unlimited',
      shareableReports: true,
      complianceBadge: true,
      rescanIncluded: 'unlimited',
      monthlyAutoScan: true,
      emailAlerts: true,
      multiSite: 5,
    },
  },
]

export function getPlan(planId: string): Plan {
  return PLANS.find(p => p.id === planId) || PLANS[0]
}
