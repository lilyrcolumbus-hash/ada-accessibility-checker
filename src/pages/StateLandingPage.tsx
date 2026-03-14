import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Shield, AlertTriangle, Scale, ArrowRight, MapPin, Clock, DollarSign, FileWarning, ChevronDown } from 'lucide-react'
import { TOP_LAWSUIT_STATES, LAWSUIT_STATS } from '@/config/constants'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

function stateNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function slugToStateName(slug: string): string | undefined {
  return Object.keys(TOP_LAWSUIT_STATES).find(name => stateNameToSlug(name) === slug)
}

function getRiskColor(riskLevel: string) {
  switch (riskLevel) {
    case 'extreme': return { bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700', badge: 'bg-danger-100 text-danger-700', dot: 'bg-danger-500' }
    case 'high': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' }
    case 'medium': return { bg: 'bg-warning-50', border: 'border-warning-200', text: 'text-warning-700', badge: 'bg-warning-100 text-warning-700', dot: 'bg-warning-500' }
    default: return { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700', badge: 'bg-success-100 text-success-700', dot: 'bg-success-500' }
  }
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-xl border border-gray-200 bg-white">
      <summary className="flex cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-base font-semibold text-gray-900">
        {question}
        <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-4 text-sm leading-relaxed text-gray-600">
        {answer}
      </div>
    </details>
  )
}

function getStateRanking(stateName: string): number {
  const sorted = Object.entries(TOP_LAWSUIT_STATES)
    .sort(([, a], [, b]) => b.lawsuits - a.lawsuits)
  return sorted.findIndex(([name]) => name === stateName) + 1
}

export default function StateLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const stateName = slug ? slugToStateName(slug) : undefined
  const stateData = stateName ? TOP_LAWSUIT_STATES[stateName] : undefined

  useEffect(() => {
    if (!stateName || !stateData) return
    document.title = `ADA Website Compliance in ${stateName} | SiteSafe`
    const meta = document.querySelector('meta[name="description"]')
    const desc = `${stateName} had ${stateData.lawsuits.toLocaleString()}+ ADA website lawsuits. Check if your ${stateName} business website is WCAG 2.1 AA compliant before the April 2026 deadline.`
    if (meta) {
      meta.setAttribute('content', desc)
    } else {
      const newMeta = document.createElement('meta')
      newMeta.name = 'description'
      newMeta.content = desc
      document.head.appendChild(newMeta)
    }
    return () => { document.title = 'SiteSafe — ADA Website Accessibility Checker' }
  }, [stateName, stateData])

  if (!slug || !stateName || !stateData) {
    navigate('/', { replace: true })
    return null
  }

  const riskColors = getRiskColor(stateData.riskLevel)
  const daysUntilDeadline = Math.max(0, Math.ceil((new Date('2026-04-26').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
  const stateRanking = getStateRanking(stateName)
  const isHighVolume = stateData.lawsuits >= 100
  const percentOfTotal = ((stateData.lawsuits / LAWSUIT_STATS.totalLawsuits2023) * 100).toFixed(1)

  const faqs = [
    {
      question: `Does the ADA apply to websites in ${stateName}?`,
      answer: `Yes. The ADA is a federal law that applies to all 50 states, including ${stateName}. Any business in ${stateName} that serves the public must make their website accessible under Title III of the ADA. The DOJ confirmed in 2024 that WCAG 2.1 Level AA is the standard, with a mandatory compliance deadline of April 26, 2026.`,
    },
    {
      question: `How many ADA website lawsuits were filed in ${stateName}?`,
      answer: `${stateName} has seen approximately ${stateData.lawsuits.toLocaleString()} ADA website accessibility lawsuits, ranking #${stateRanking} among all US states. ${stateName} is classified as "${stateData.riskLevel} risk" for ADA website litigation. ${isHighVolume ? 'Businesses in ' + stateName + ' face significantly higher lawsuit risk than the national average.' : ''}`,
    },
    {
      question: `Does ${stateName} have additional accessibility laws?`,
      answer: `In addition to the federal ADA requirements, ${stateName} may have state-level disability rights laws that provide additional protections. Regardless of state law, all ${stateName} businesses must comply with the federal ADA Title III and the April 2026 WCAG 2.1 AA deadline. Some states impose additional penalties for non-compliance.`,
    },
    {
      question: `What types of businesses get sued in ${stateName}?`,
      answer: `In ${stateName}, the most-sued industries include e-commerce (1,842 lawsuits nationally), retail (1,245), restaurants (567), and hotels (489). Any ${stateName} business with a website — from local shops to professional services — can be targeted. ${LAWSUIT_STATS.smallBusinessPercentage}% of ADA lawsuits target small businesses under $25M in revenue.`,
    },
    {
      question: `How much does an ADA lawsuit cost in ${stateName}?`,
      answer: `ADA website lawsuits in ${stateName} typically settle for $5,000 to $20,000. However, legal defense costs alone range from $50,000 to $100,000+, even if you win. Most ${stateName} businesses choose to settle quickly rather than fight in court. A $49 SiteSafe audit can help prevent these costly lawsuits entirely.`,
    },
    {
      question: 'Can I use an accessibility overlay widget instead?',
      answer: 'No. Accessibility overlay widgets (like accessiBe, fined $1M by the FTC) do not provide real ADA compliance. Courts have consistently ruled that overlays are insufficient. In fact, 22.6% of businesses sued in 2025 had overlay widgets installed. SiteSafe provides real code fixes — not band-aid widgets.',
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
            <MapPin className="h-3.5 w-3.5" />
            #{stateRanking} state for ADA lawsuits — {stateData.riskLevel} risk
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            ADA Website Compliance in{' '}
            <span className="text-primary-700">{stateName}</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            {stateName} businesses face {stateData.riskLevel} risk for ADA website lawsuits.
            With {stateData.lawsuits.toLocaleString()} lawsuits filed and a federal deadline of April 26, 2026,
            {stateName} businesses need to act now.
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/#hero">
              <Button size="lg" className="w-full sm:w-auto">
                <Shield className="mr-2 h-5 w-5" />
                Scan My Website
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
                <Scale className="h-5 w-5 text-danger-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{stateData.lawsuits.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">Lawsuits in {stateName}</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-warning-100">
                <MapPin className="h-5 w-5 text-warning-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">#{stateRanking}</p>
              <p className="mt-1 text-sm text-gray-500">State ranking by lawsuits</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{percentOfTotal}%</p>
              <p className="mt-1 text-sm text-gray-500">Of all US ADA lawsuits</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{daysUntilDeadline}</p>
              <p className="mt-1 text-sm text-gray-500">Days until deadline</p>
            </div>
          </div>
        </div>
      </section>

      {/* State risk details */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            ADA Lawsuit Risk for {stateName} Businesses
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            {stateName} ranks <strong className="text-gray-900">#{stateRanking} in the nation</strong> for ADA website
            accessibility lawsuits, with <strong className="text-gray-900">{stateData.lawsuits.toLocaleString()} cases filed</strong>.
            {isHighVolume
              ? ` This makes ${stateName} one of the most dangerous states for businesses with non-compliant websites.`
              : ` While ${stateName} has fewer lawsuits than states like New York and Florida, the federal ADA deadline applies equally to all states.`
            }
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <FileWarning className="h-5 w-5 text-danger-600" />
                <h3 className="font-bold text-danger-800">Federal Deadline: April 26, 2026</h3>
              </div>
              <p className="text-sm text-gray-700">
                The DOJ rule applies to every business in {stateName}. After this date, WCAG 2.1 Level AA
                compliance is mandatory. Non-compliant websites can face lawsuits, fines, and injunctions.
                You have <strong>{daysUntilDeadline} days</strong> to comply.
              </p>
            </div>

            <div className="rounded-xl border border-warning-200 bg-warning-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="h-5 w-5 text-warning-600" />
                <h3 className="font-bold text-warning-800">The Cost of Non-Compliance</h3>
              </div>
              <p className="text-sm text-gray-700">
                ADA lawsuits in {stateName} typically settle for $5,000–$20,000. Defense costs
                run $50,000–$100,000+, even if dismissed. Serial filers specifically target
                {isHighVolume ? ` high-volume states like ${stateName}` : ' businesses across all 50 states'}.
              </p>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Scale className="h-5 w-5 text-orange-600" />
                <h3 className="font-bold text-orange-800">Small Businesses at Risk</h3>
              </div>
              <p className="text-sm text-gray-700">
                {LAWSUIT_STATS.smallBusinessPercentage}% of ADA website lawsuits target businesses under $25M revenue.
                In {stateName}, local shops, restaurants, dental offices, and service businesses are the most
                common targets. No business is too small to be sued.
              </p>
            </div>

            <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-primary-800">Overlays Don't Protect You</h3>
              </div>
              <p className="text-sm text-gray-700">
                22.6% of businesses sued in 2025 had accessibility overlays installed. The FTC
                fined accessiBe $1M for false claims. Only real code fixes — like the ones SiteSafe
                provides — address the root accessibility issues.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary-700 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            {stateName} Businesses: The Clock Is Ticking
          </h2>
          <p className="mt-3 text-lg text-primary-100">
            {daysUntilDeadline} days until the April 2026 federal deadline. Scan your website
            in 30 seconds and get your compliance score — free.
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
              Protect Your {stateName} Business
            </h2>
            <p className="mt-3 text-gray-500">
              Pay $49 once to fix your site — or risk a $10,000+ lawsuit in {stateName}.
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
                  Most Popular
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
                <li className="flex items-start gap-2"><Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Up to 50 pages</li>
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
              <span className="font-bold text-danger-700">{stateName} businesses: {stateData.lawsuits.toLocaleString()} lawsuits and counting.</span>
              {' '}Average settlement: $10,000–$20,000. Defense costs: $50,000+.{' '}
              <span className="font-semibold">A $49 audit is cheaper than a lawyer's first phone call.</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            ADA Website Compliance FAQs for {stateName}
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
            Is Your {stateName} Website Compliant?
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
          The information on this page, including lawsuit statistics and risk assessments for {stateName}, is for informational purposes only
          and does not constitute legal advice. Consult an accessibility specialist or attorney for full compliance guidance.
        </p>
      </div>
    </div>
  )
}
