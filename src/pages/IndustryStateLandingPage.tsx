import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Shield, AlertTriangle, Scale, ArrowRight, Clock, MapPin, Building2 } from 'lucide-react'
import { INDUSTRY_RISK, TOP_LAWSUIT_STATES, LAWSUIT_STATS } from '@/config/constants'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { INDUSTRY_LABELS, getRiskColor, FAQItem, slugToStateName } from '@/components/seo/shared'

function getCombinedRiskLevel(industryRisk: string, stateRisk: string): 'extreme' | 'high' | 'medium' | 'low' {
  const riskValues: Record<string, number> = { extreme: 4, high: 3, medium: 2, low: 1 }
  const combined = (riskValues[industryRisk] || 1) + (riskValues[stateRisk] || 1)
  if (combined >= 7) return 'extreme'
  if (combined >= 5) return 'high'
  if (combined >= 3) return 'medium'
  return 'low'
}

function getSettlementRange(industryMultiplier: number, stateRisk: string): string {
  const base = stateRisk === 'extreme' ? 15000 : stateRisk === 'high' ? 10000 : stateRisk === 'medium' ? 7500 : 5000
  const min = Math.round(base * industryMultiplier / 1000) * 1000
  const max = Math.round(min * 2.5 / 1000) * 1000
  return `$${min.toLocaleString()}–$${max.toLocaleString()}`
}

export default function IndustryStateLandingPage() {
  const { industrySlug, stateSlug } = useParams<{ industrySlug: string; stateSlug: string }>()

  const industry = industrySlug ? INDUSTRY_RISK[industrySlug] : undefined
  const industryLabel = industrySlug
    ? INDUSTRY_LABELS[industrySlug] || industrySlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : ''

  const stateName = stateSlug ? slugToStateName(stateSlug) : undefined
  const stateData = stateName ? TOP_LAWSUIT_STATES[stateName] : undefined

  const combinedRisk = industry && stateData
    ? getCombinedRiskLevel(industry.riskLevel, stateData.riskLevel)
    : 'medium'
  const riskColors = getRiskColor(combinedRisk)
  const settlementRange = industry && stateData
    ? getSettlementRange(industry.multiplier, stateData.riskLevel)
    : '$5,000–$20,000'

  const daysUntilDeadline = Math.max(0, Math.ceil((new Date(LAWSUIT_STATS.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  useEffect(() => {
    if (!industrySlug || !industry || !stateName || !stateData) return
    document.title = `ADA Compliance for ${industryLabel} in ${stateName} | SiteSafe`
    const meta = document.querySelector('meta[name="description"]')
    const desc = `${industryLabel} businesses in ${stateName} face ${combinedRisk} risk for ADA lawsuits. ${industry.lawsuitCount}+ industry lawsuits, ${stateData.lawsuits}+ state lawsuits. Scan your site before the April 2026 deadline.`
    if (meta) {
      meta.setAttribute('content', desc)
    } else {
      const newMeta = document.createElement('meta')
      newMeta.name = 'description'
      newMeta.content = desc
      document.head.appendChild(newMeta)
    }
    return () => {
      document.title = 'SiteSafe — ADA Website Accessibility Checker'
      const meta = document.querySelector('meta[name="description"]')
      if (meta) meta.setAttribute('content', 'Scan your website for ADA/WCAG 2.1 AA violations. Get plain English results with copy-paste fixes. Avoid $10,000+ lawsuits.')
    }
  }, [industrySlug, industry, stateName, stateData, industryLabel, combinedRisk])

  if (!industrySlug || !industry || !stateName || !stateData) {
    return <Navigate to="/" replace />
  }

  const faqs = [
    {
      question: `Are ${industryLabel.toLowerCase()} businesses in ${stateName} required to have ADA-compliant websites?`,
      answer: `Yes. The ADA is a federal law that applies to every state, including ${stateName}. ${industryLabel} businesses that serve the public must make their websites accessible under Title III. With ${stateData.lawsuits.toLocaleString()} lawsuits filed in ${stateName} and ${industry.lawsuitCount.toLocaleString()} targeting the ${industryLabel.toLowerCase()} industry nationally, the risk of litigation is real. The April 26, 2026 deadline makes WCAG 2.1 Level AA the mandatory standard.`,
    },
    {
      question: `What is the lawsuit risk for ${industryLabel.toLowerCase()} websites in ${stateName}?`,
      answer: `The combined risk for ${industryLabel.toLowerCase()} businesses in ${stateName} is rated "${combinedRisk}." The ${industryLabel.toLowerCase()} industry carries a ${industry.multiplier}x risk multiplier, and ${stateName} has recorded ${stateData.lawsuits.toLocaleString()} ADA website lawsuits. Settlement costs for ${industryLabel.toLowerCase()} businesses in ${stateName} typically range from ${settlementRange}, with defense costs reaching $50,000–$100,000+.`,
    },
    {
      question: `How much would an ADA lawsuit cost my ${industryLabel.toLowerCase()} business in ${stateName}?`,
      answer: `ADA lawsuits against ${industryLabel.toLowerCase()} businesses in ${stateName} typically result in settlements of ${settlementRange}. Legal defense costs alone range from $50,000 to $100,000+, regardless of outcome. Serial filers like Brian Whitaker (1,700+ lawsuits) systematically target both high-risk industries and high-volume states. A $49 SiteSafe audit can identify and fix issues before they become a six-figure problem.`,
    },
    {
      question: `What accessibility issues are most common on ${industryLabel.toLowerCase()} websites in ${stateName}?`,
      answer: `${industryLabel} websites commonly fail on: missing alt text on product/service images, poor color contrast, inaccessible forms and booking systems, missing form labels, broken keyboard navigation, and improper heading structure. SiteSafe scans for 11 critical WCAG 2.1 AA violations and provides copy-paste code fixes for each issue — with platform-specific guides for Shopify, WordPress, Wix, and Squarespace.`,
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className={cn(
        'relative overflow-hidden bg-gradient-to-b from-primary-50 to-white',
        'px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8',
      )}>
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-100 opacity-40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className={cn('mb-5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium', riskColors.border, riskColors.bg, riskColors.text)}>
            <span className={cn('h-2 w-2 rounded-full', combinedRisk === 'extreme' ? 'animate-pulse' : '', riskColors.dot)} />
            {combinedRisk.charAt(0).toUpperCase() + combinedRisk.slice(1)} combined risk
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            ADA Compliance for{' '}
            <span className="text-primary-700">{industryLabel}</span>{' '}
            Businesses in{' '}
            <span className="text-primary-700">{stateName}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            {industryLabel} businesses in {stateName} face {combinedRisk} risk for ADA website lawsuits.
            With {industry.lawsuitCount.toLocaleString()} industry lawsuits and {stateData.lawsuits.toLocaleString()} filed
            in {stateName}, non-compliant websites are a ticking time bomb.
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/#hero">
              <Button size="lg" className="w-full sm:w-auto">
                <Shield className="mr-2 h-5 w-5" />
                Scan My {industryLabel} Website
              </Button>
            </Link>
            <a href="#pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-100">
                <Building2 className="h-5 w-5 text-danger-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{industry.lawsuitCount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">{industryLabel} lawsuits nationally</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-warning-100">
                <MapPin className="h-5 w-5 text-warning-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{stateData.lawsuits.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">Lawsuits in {stateName}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <p className={cn('text-3xl font-extrabold', riskColors.text)}>
                {combinedRisk.charAt(0).toUpperCase() + combinedRisk.slice(1)}
              </p>
              <p className="mt-1 text-sm text-gray-500">Combined risk level</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <Scale className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{settlementRange}</p>
              <p className="mt-1 text-sm text-gray-500">Estimated settlement range</p>
            </div>
          </div>
        </div>
      </section>

      {/* Deadline Countdown */}
      <section className="bg-gray-900 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Clock className="h-5 w-5 text-danger-400" />
            <p className="text-sm font-semibold uppercase tracking-wider text-danger-400">Federal Compliance Deadline</p>
          </div>
          <p className="text-5xl font-extrabold text-white sm:text-6xl">{daysUntilDeadline}</p>
          <p className="mt-2 text-lg text-gray-400">days until April 26, 2026</p>
          <p className="mt-4 text-sm text-gray-500 max-w-xl mx-auto">
            After this date, every {industryLabel.toLowerCase()} website in {stateName} must meet WCAG 2.1 Level AA standards.
            Non-compliance means lawsuits, fines, and injunctions — with no grace period.
          </p>
        </div>
      </section>

      {/* Why This Combination Is Dangerous */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Why {industryLabel} Websites in {stateName} Are Prime Targets
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            The {industryLabel.toLowerCase()} industry has a <strong className="text-gray-900">{industry.multiplier}x risk multiplier</strong>,
            and {stateName} has <strong className="text-gray-900">{stateData.lawsuits.toLocaleString()} recorded lawsuits</strong>.
            This combination creates a <span className={cn('font-bold', riskColors.text)}>{combinedRisk} risk</span> environment
            for your business. Serial filers actively target {industryLabel.toLowerCase()} websites in {stateData.riskLevel === 'extreme' || stateData.riskLevel === 'high' ? 'high-volume states like ' + stateName : stateName}.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-5 w-5 text-danger-600" />
                <h3 className="font-bold text-danger-800">{industryLabel}: {industry.riskLevel.charAt(0).toUpperCase() + industry.riskLevel.slice(1)} Risk Industry</h3>
              </div>
              <p className="text-sm text-gray-700">
                With {industry.lawsuitCount.toLocaleString()} lawsuits and a {industry.multiplier}x risk multiplier,
                {industryLabel.toLowerCase()} is one of the most targeted industries for ADA litigation.
                Every product page, booking form, and checkout flow must be accessible.
              </p>
            </div>

            <div className="rounded-xl border border-warning-200 bg-warning-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <MapPin className="h-5 w-5 text-warning-600" />
                <h3 className="font-bold text-warning-800">{stateName}: {stateData.riskLevel.charAt(0).toUpperCase() + stateData.riskLevel.slice(1)} Risk State</h3>
              </div>
              <p className="text-sm text-gray-700">
                {stateName} has recorded {stateData.lawsuits.toLocaleString()} ADA website lawsuits,
                accounting for {((stateData.lawsuits / LAWSUIT_STATS.totalLawsuits2023) * 100).toFixed(1)}% of
                all US cases. {stateData.riskLevel === 'extreme' || stateData.riskLevel === 'high'
                  ? `${stateName} is a top target state for serial ADA filers.`
                  : `The federal deadline applies equally to all ${stateName} businesses.`}
              </p>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Scale className="h-5 w-5 text-orange-600" />
                <h3 className="font-bold text-orange-800">Settlement Costs Add Up Fast</h3>
              </div>
              <p className="text-sm text-gray-700">
                {industryLabel} businesses in {stateName} face estimated settlements of {settlementRange}.
                Legal defense alone costs $50,000–$100,000+. {LAWSUIT_STATS.smallBusinessPercentage}% of
                lawsuits target small businesses under $25M revenue — your business is a target.
              </p>
            </div>

            <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-primary-800">Overlays Won't Save You</h3>
              </div>
              <p className="text-sm text-gray-700">
                22.6% of businesses sued in 2025 had accessibility overlays installed. The FTC fined
                accessiBe $1M for false claims. Courts have ruled overlays insufficient.
                SiteSafe provides real code fixes that address the root issues in your {industryLabel.toLowerCase()} website.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary-700 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            {stateName} {industryLabel} Owners: Don't Wait for a Lawsuit
          </h2>
          <p className="mt-3 text-lg text-primary-100">
            Scan your {industryLabel.toLowerCase()} website in 30 seconds — free. Get your compliance score,
            {stateName}-specific risk assessment, and a prioritized list of issues to fix.
          </p>
          <div className="mt-8">
            <Link to="/#hero">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 focus:ring-white">
                Scan My Website Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Protect Your {stateName} {industryLabel} Business
            </h2>
            <p className="mt-3 text-gray-500">
              A $49 audit vs a {settlementRange} lawsuit. The math speaks for itself.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Free */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Free Scan</h3>
              <p className="mt-1 text-sm text-gray-500">Quick compliance check</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">$0</span>
              </div>
              <Link to="/#hero" className="mb-5">
                <Button variant="outline" size="md" className="w-full">Scan Free</Button>
              </Link>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> 1 page scanned</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> Compliance score</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> All issues visible</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> 1 free code fix</li>
              </ul>
            </div>

            {/* Fix My Site */}
            <div className="relative flex flex-col rounded-2xl border-2 border-primary-600 bg-white p-6 shadow-md ring-2 ring-primary-600">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Best for {industryLabel}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Fix My Site</h3>
              <p className="mt-1 text-sm text-gray-500">Complete audit + fixes</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">$49</span>
                <span className="text-sm text-gray-500 ml-1">one-time</span>
              </div>
              <Link to="/register?plan=fix-my-site" className="mb-5">
                <Button size="md" className="w-full">Fix My Site</Button>
              </Link>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Up to 25 pages</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> All code fixes included</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Priority action plan</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Shareable report</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Platform install guides</li>
              </ul>
            </div>

            {/* Compliance Shield */}
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Compliance Shield</h3>
              <p className="mt-1 text-sm text-gray-500">Ongoing monitoring</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">$17</span>
                <span className="text-sm text-gray-500 ml-1">/month</span>
                <p className="mt-1 text-xs text-gray-500">Billed annually at $199/year</p>
              </div>
              <Button variant="outline" size="md" className="w-full mb-5 opacity-60 cursor-not-allowed" disabled>
                Coming Soon
              </Button>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> Everything in Fix My Site</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> Monthly auto-scans</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> Email alerts</li>
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-success-500" /> Compliance badge</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-danger-50 border border-danger-200 px-6 py-4 text-center">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-danger-700">
                {industryLabel} in {stateName}: {combinedRisk} risk.
              </span>
              {' '}{industry.lawsuitCount.toLocaleString()} industry lawsuits + {stateData.lawsuits.toLocaleString()} state lawsuits.{' '}
              <span className="font-semibold">A $49 audit is the cheapest insurance you can buy.</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            ADA Compliance FAQs: {industryLabel} in {stateName}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-gray-200 bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
            Is Your {stateName} {industryLabel} Website Compliant?
          </h2>
          <p className="mt-3 text-gray-600">
            Find out in 30 seconds. Free scan, no signup required.
          </p>
          <div className="mt-8">
            <Link to="/#hero">
              <Button size="lg">
                <Shield className="mr-2 h-5 w-5" />
                Check My Website Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-3xl text-center text-xs text-gray-400">
          <strong>Legal Disclaimer:</strong> SiteSafe does not guarantee ADA compliance or legal protection.
          The information on this page, including lawsuit statistics and risk assessments for {industryLabel.toLowerCase()} businesses
          in {stateName}, is for informational purposes only and does not constitute legal advice.
          Consult an accessibility specialist or attorney for full compliance guidance.
        </p>
      </div>
    </div>
  )
}
