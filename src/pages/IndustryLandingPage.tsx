import { useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { Shield, AlertTriangle, Scale, ArrowRight, FileWarning, Clock, DollarSign, Users } from 'lucide-react'
import { INDUSTRY_RISK, LAWSUIT_STATS } from '@/config/constants'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { INDUSTRY_LABELS, getRiskColor, FAQItem } from '@/components/seo/shared'

const INDUSTRY_DESCRIPTIONS: Record<string, string> = {
  'ecommerce': 'Online stores are the #1 target for ADA lawsuits. Every product page, checkout flow, and image needs to be accessible.',
  'retail': 'Retail websites with product catalogs, store locators, and online ordering face extreme risk of accessibility lawsuits.',
  'restaurant': 'Restaurant websites with menus, online ordering, and reservation systems are prime targets for serial ADA litigants.',
  'food-delivery': 'Food delivery platforms must ensure ordering flows, menu displays, and account management are fully accessible.',
  'hotel': 'Hotel websites with booking engines, room galleries, and amenity listings face high volumes of accessibility complaints.',
  'travel': 'Travel websites with booking systems, itinerary builders, and image-heavy content are frequent lawsuit targets.',
  'healthcare': 'Healthcare websites must be accessible under ADA and Section 508. Patient portals and appointment booking are common failure points.',
  'dental': 'Dental practice websites with appointment booking, patient forms, and service descriptions need full WCAG compliance.',
  'pharmacy': 'Pharmacy websites handling prescriptions, medication info, and health content face strict accessibility requirements.',
  'finance': 'Financial services websites with account access, calculators, and application forms must meet strict accessibility standards.',
  'banking': 'Banking websites with online banking, loan applications, and account management face significant ADA compliance obligations.',
  'insurance': 'Insurance websites with quote generators, claims portals, and policy documents need accessible design throughout.',
  'real-estate': 'Real estate websites with property listings, virtual tours, and mortgage calculators are increasingly targeted by ADA lawsuits.',
  'automotive': 'Automotive dealer websites with inventory search, financing tools, and scheduling face growing accessibility litigation.',
  'fitness': 'Fitness and gym websites with class schedules, membership signup, and booking systems need ADA-compliant design.',
  'salon-spa': 'Salon and spa websites with service menus, online booking, and gift cards must be accessible to all users.',
  'education': 'Educational institution websites must comply with ADA and Section 504, covering course catalogs, applications, and learning materials.',
  'entertainment': 'Entertainment venues with event listings, ticket purchasing, and seating charts face accessibility compliance demands.',
  'media': 'Media and publishing websites must ensure articles, video content, and navigation are accessible to users with disabilities.',
  'government': 'Government websites have legal obligations under ADA Title II. All public services and information must be fully accessible.',
  'nonprofit': 'Nonprofit websites with donation forms, event pages, and volunteer signups must be accessible to serve their full community.',
  'legal': 'Law firm websites with contact forms, case results, and attorney profiles should exemplify compliance with accessibility law.',
  'accounting': 'Accounting firm websites with client portals, tax resources, and scheduling tools need accessible interfaces.',
  'construction': 'Construction company websites with project galleries, bid submissions, and contact forms benefit from proactive accessibility compliance.',
  'manufacturing': 'Manufacturing websites with product catalogs, specification sheets, and order forms should meet WCAG standards.',
  'technology': 'Technology company websites should lead by example in accessibility, covering documentation, demos, and support portals.',
  'consulting': 'Consulting firm websites with case studies, contact forms, and team bios should demonstrate accessible design practices.',
  'agriculture': 'Agricultural business websites with product listings, ordering, and resource pages benefit from accessibility compliance.',
}

export default function IndustryLandingPage() {
  const { slug } = useParams<{ slug: string }>()

  const industry = slug ? INDUSTRY_RISK[slug] : undefined
  const label = slug ? INDUSTRY_LABELS[slug] || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : ''
  const description = slug ? INDUSTRY_DESCRIPTIONS[slug] || `${label} businesses face increasing ADA lawsuit risk. Ensure your website meets WCAG 2.1 AA compliance standards.` : ''

  useEffect(() => {
    if (!slug || !industry) return
    document.title = `ADA Compliance for ${label} | SiteSafe`
    const meta = document.querySelector('meta[name="description"]')
    const desc = `${label} businesses faced ${industry.lawsuitCount}+ ADA website lawsuits. Check your ${label.toLowerCase()} website for WCAG 2.1 AA compliance before the April 2026 deadline.`
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
  }, [slug, industry, label])

  if (!slug || !industry) {
    return <Navigate to="/" replace />
  }

  const riskColors = getRiskColor(industry.riskLevel)
  const daysUntilDeadline = Math.max(0, Math.ceil((new Date('2026-04-26').getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

  const faqs = [
    {
      question: `Are ${label.toLowerCase()} websites required to be ADA compliant?`,
      answer: `Yes. Under the Americans with Disabilities Act (ADA), any business that serves the public — including ${label.toLowerCase()} businesses — must make their website accessible. The DOJ has confirmed that websites are "places of public accommodation" under Title III. Starting April 26, 2026, WCAG 2.1 Level AA compliance becomes the explicit standard.`,
    },
    {
      question: `How many ADA lawsuits target ${label.toLowerCase()} businesses?`,
      answer: `The ${label.toLowerCase()} industry has seen approximately ${industry.lawsuitCount.toLocaleString()} ADA website accessibility lawsuits in recent years. With a ${industry.multiplier}x risk multiplier compared to the average business, ${label.toLowerCase()} is rated as "${industry.riskLevel} risk" for ADA litigation.`,
    },
    {
      question: `What are the penalties for a non-compliant ${label.toLowerCase()} website?`,
      answer: `ADA lawsuits against ${label.toLowerCase()} businesses typically result in settlements between $5,000 and $20,000, plus $50,000 to $100,000+ in legal defense costs. Serial filers can sue hundreds of businesses, and your website doesn't need to be intentionally inaccessible — any barrier counts.`,
    },
    {
      question: `What website features do ${label.toLowerCase()} businesses need to fix?`,
      answer: `Common issues include: missing alt text on images, poor color contrast, inaccessible forms and checkout flows, missing form labels, keyboard navigation problems, and lack of proper heading structure. SiteSafe scans for 11 critical WCAG 2.1 AA checks specific to ${label.toLowerCase()} websites.`,
    },
    {
      question: `How long does it take to fix a ${label.toLowerCase()} website?`,
      answer: `Most ${label.toLowerCase()} websites can address critical accessibility issues within 1-5 hours using SiteSafe's copy-paste code fixes. Our $49 Fix My Site report provides exact code changes for every issue found, with step-by-step instructions for Shopify, WooCommerce, WordPress, Wix, and other platforms.`,
    },
    {
      question: 'Is an accessibility overlay enough for ADA compliance?',
      answer: 'No. The FTC fined accessiBe $1 million in 2025 for misleading claims about overlay effectiveness. 22.6% of businesses sued in 2025 had overlays installed. Courts have ruled that overlays do not constitute compliance. SiteSafe provides real code fixes, not band-aid overlays.',
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
            <span className={cn('h-2 w-2 rounded-full', industry.riskLevel === 'extreme' ? 'animate-pulse' : '', riskColors.dot)} />
            {industry.riskLevel.charAt(0).toUpperCase() + industry.riskLevel.slice(1)} risk industry — {industry.lawsuitCount.toLocaleString()} lawsuits filed
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            ADA Compliance for{' '}
            <span className="text-primary-700">{label}</span>{' '}
            Businesses
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            {description}
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/#hero">
              <Button size="lg" className="w-full sm:w-auto">
                <Shield className="mr-2 h-5 w-5" />
                Scan My {label} Website
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
              <p className="text-3xl font-extrabold text-gray-900">{industry.lawsuitCount.toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">{label} lawsuits filed</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-warning-100">
                <AlertTriangle className="h-5 w-5 text-warning-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{industry.multiplier}x</p>
              <p className="mt-1 text-sm text-gray-500">Risk multiplier vs average</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">$10K+</p>
              <p className="mt-1 text-sm text-gray-500">Average lawsuit settlement</p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">{daysUntilDeadline}</p>
              <p className="mt-1 text-sm text-gray-500">Days until federal deadline</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why this industry is at risk */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Why {label} Websites Are Being Sued
          </h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            The {label.toLowerCase()} industry has a <strong className="text-gray-900">{industry.multiplier}x risk multiplier</strong> compared
            to average businesses. With <strong className="text-gray-900">{industry.lawsuitCount.toLocaleString()} lawsuits</strong> filed against {label.toLowerCase()} websites,
            this sector is rated <span className={cn('font-bold', riskColors.text)}>{industry.riskLevel} risk</span> for ADA litigation.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-danger-200 bg-danger-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <FileWarning className="h-5 w-5 text-danger-600" />
                <h3 className="font-bold text-danger-800">Serial Filers Target {label}</h3>
              </div>
              <p className="text-sm text-gray-700">
                Plaintiffs like Brian Whitaker (1,700+ lawsuits) and Orlando Garcia (800+ lawsuits)
                systematically target {label.toLowerCase()} websites. A single missed alt tag can trigger a federal lawsuit.
              </p>
            </div>

            <div className="rounded-xl border border-warning-200 bg-warning-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="h-5 w-5 text-warning-600" />
                <h3 className="font-bold text-warning-800">April 2026 Deadline</h3>
              </div>
              <p className="text-sm text-gray-700">
                The DOJ's new rule makes WCAG 2.1 AA compliance mandatory by April 26, 2026.
                After this date, every {label.toLowerCase()} website is expected to be fully accessible — no excuses.
              </p>
            </div>

            <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="h-5 w-5 text-orange-600" />
                <h3 className="font-bold text-orange-800">Costly Settlements</h3>
              </div>
              <p className="text-sm text-gray-700">
                Typical settlements range from $5,000 to $20,000. But legal defense alone costs
                $50,000 to $100,000+. Most {label.toLowerCase()} businesses settle quickly because fighting is even more expensive.
              </p>
            </div>

            <div className="rounded-xl border border-primary-200 bg-primary-50 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-primary-800">98% Non-Compliant</h3>
              </div>
              <p className="text-sm text-gray-700">
                Studies show {LAWSUIT_STATS.websitesNonCompliant}% of websites fail WCAG 2.1 AA standards.
                If your {label.toLowerCase()} website hasn't been audited, it almost certainly has violations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-primary-700 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Don't Wait for a Lawsuit to Find Out
          </h2>
          <p className="mt-3 text-lg text-primary-100">
            Scan your {label.toLowerCase()} website in 30 seconds — free. Get your compliance score, risk assessment,
            and a prioritized list of issues to fix.
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
              Protect Your {label} Business Today
            </h2>
            <p className="mt-3 text-gray-500">
              A $49 audit report vs a $10,000+ lawsuit. The math is simple.
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
                  Best for {label}
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
              <span className="font-bold text-danger-700">Average ADA lawsuit settlement: $10,000–$20,000.</span>
              {' '}Average defense cost: $50,000+.{' '}
              <span className="font-semibold">A $49 audit is the cheapest insurance for your {label.toLowerCase()} business.</span>
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            ADA Compliance FAQs for {label} Businesses
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
            Is Your {label} Website Compliant?
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
          The information on this page, including lawsuit statistics and risk assessments, is for informational purposes only
          and does not constitute legal advice. Consult an accessibility specialist or attorney for full compliance guidance.
        </p>
      </div>
    </div>
  )
}
