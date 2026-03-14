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
  comingSoon?: boolean
}

export const FREE_ISSUES_VISIBLE = 3

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Scan',
    tagline: 'See your biggest risks',
    price: 0,
    priceId: '',
    billing: 'free',
    features: [
      'Scan 1 page',
      'Compliance score & risk level',
      `Top ${FREE_ISSUES_VISIBLE} critical issues with fixes`,
      'Lawsuit risk by industry & state',
    ],
    limits: {
      pagesPerScan: 1,
      codeFixesVisible: FREE_ISSUES_VISIBLE,
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
    tagline: 'Fix everything + prove compliance',
    price: 49,
    priceId: 'price_1TAdnSFfYL1pGw0o7zQs4NdX',
    billing: 'one-time',
    popular: true,
    features: [
      'Scan your entire site',
      'All issues with copy-paste fixes',
      'Accessibility Audit Report (PDF)',
      '"ADA Tested" badge for your site',
      'Shareable report link',
      '1 re-scan to verify fixes',
    ],
    limits: {
      pagesPerScan: 50,
      codeFixesVisible: 'unlimited',
      shareableReports: true,
      complianceBadge: true,
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
    priceId: 'price_1TAdnUFfYL1pGw0oGAqWfMTa',
    billing: 'yearly',
    features: [
      'Everything in Fix My Site',
      'Up to 5 websites',
      'Unlimited re-scans',
      'Monthly automated re-scans',
      'Email alerts if score drops',
      'Verified compliance badge',
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
