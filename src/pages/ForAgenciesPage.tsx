import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowRight, Store, DollarSign, Users, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { FAQItem } from '@/components/seo/shared'

const faqs = [
  {
    question: 'Do you support Shopify and WooCommerce specifically?',
    answer: 'Yes. Ecommerce sites account for roughly 70% of all ADA website accessibility lawsuits filed in 2025 — more than every other industry combined — which is why Shopify and WooCommerce stores are the core use case here. SiteSafe includes step-by-step install guides for both platforms for every fix it finds, alongside WordPress, Wix, and Squarespace.',
  },
  {
    question: 'How does the wholesale pricing work?',
    answer: 'You buy scans at the wholesale rate ($25 per one-time scan, or $99/year per store for ongoing monitoring) and offer them to your own clients under your own brand — most agencies fold it into an existing maintenance or support package at $150-200, keeping the difference. There\'s no revenue share or reporting back to us — you set your own client price.',
  },
  {
    question: 'How many stores do I need to make this worth it?',
    answer: 'A typical Shopify or WooCommerce agency manages 15-30 active stores. At even a conservative $75 margin per store per year, that\'s $1,125-$2,250/year in added revenue from a service you\'re not building yourself — on top of whatever you already charge for the maintenance package it rides in.',
  },
  {
    question: 'What do my clients actually get?',
    answer: 'A full scan against all 11 WCAG 2.1 AA checks, a compliance score, and copy-paste code fixes for every issue found — with Shopify/WooCommerce-specific instructions for exactly where to paste each fix. Nothing generic or overlay-based.',
  },
  {
    question: 'How do I get started?',
    answer: 'Reach out below with roughly how many stores you manage. We\'ll set up wholesale access and you can run your first scan the same day.',
  },
]

export default function ForAgenciesPage() {
  useEffect(() => {
    document.title = 'SiteSafe for Agencies — Wholesale ADA Scans for Shopify & WooCommerce'
    const meta = document.querySelector('meta[name="description"]')
    const desc = 'Wholesale ADA/WCAG accessibility scans for Shopify and WooCommerce agencies. Buy at $25/scan or $99/store/year, resell as part of your maintenance package.'
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
      const m = document.querySelector('meta[name="description"]')
      if (m) m.setAttribute('content', 'Scan your website for ADA/WCAG 2.1 AA violations. Get plain English results with copy-paste fixes. Avoid $10,000+ lawsuits.')
    }
  }, [])

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-100 opacity-40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700">
            <Store className="h-4 w-4" />
            For Shopify &amp; WooCommerce agencies and freelancers
          </div>

          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Add ADA Compliance to Your{' '}
            <span className="text-primary-700">Client Maintenance Packages</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-gray-600">
            Ecommerce sites are ~70% of all ADA website lawsuits filed in 2025. Your clients are already exposed —
            buy scans wholesale, resell them under your own brand, keep the margin.
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <a href="#pricing">
              <Button size="lg" className="w-full sm:w-auto">
                See Wholesale Pricing
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </a>
            <a href="#contact">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-danger-100">
                <Store className="h-5 w-5 text-danger-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">~70%</p>
              <p className="mt-1 text-sm text-gray-500">of 2025 ADA website lawsuits were against ecommerce sites</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary-100">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">15-30</p>
              <p className="mt-1 text-sm text-gray-500">stores a typical Shopify/WooCommerce agency manages</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-success-100">
                <DollarSign className="h-5 w-5 text-success-600" />
              </div>
              <p className="text-3xl font-extrabold text-gray-900">$25</p>
              <p className="mt-1 text-sm text-gray-500">your wholesale cost per scan — you set your own client price</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">1</div>
              <h3 className="font-bold text-gray-900">Reach out below</h3>
              <p className="mt-1 text-sm text-gray-600">Tell us roughly how many stores you manage — we set up wholesale access the same day.</p>
            </div>
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">2</div>
              <h3 className="font-bold text-gray-900">Scan client stores</h3>
              <p className="mt-1 text-sm text-gray-600">Run a full 11-check WCAG 2.1 AA scan on any client's Shopify or WooCommerce store, at your wholesale rate.</p>
            </div>
            <div>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">3</div>
              <h3 className="font-bold text-gray-900">Resell under your brand</h3>
              <p className="mt-1 text-sm text-gray-600">Fold it into your maintenance package at whatever price you choose — you keep the margin, no revenue share back to us.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Wholesale pricing */}
      <section id="pricing" className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Wholesale Pricing
            </h2>
            <p className="mt-3 text-gray-500">
              Buy at these rates, charge your clients whatever fits your maintenance package.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">One-time scan</h3>
              <p className="mt-1 text-sm text-gray-500">Per store, per audit</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">$25</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Full 11-check WCAG 2.1 AA scan</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> All code fixes, Shopify/WooCommerce guides included</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Typical client price: $150-200</li>
              </ul>
            </div>

            <div className="relative flex flex-col rounded-2xl border-2 border-primary-600 bg-white p-6 shadow-md ring-2 ring-primary-600">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
                  Best margin
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Ongoing monitoring</h3>
              <p className="mt-1 text-sm text-gray-500">Per store, per year</p>
              <div className="my-4">
                <span className="text-4xl font-extrabold text-gray-900">$99</span>
                <span className="text-sm text-gray-500 ml-1">/year</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Everything in the one-time scan</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Monthly re-scans + drop alerts</li>
                <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" /> Fits neatly into a recurring maintenance line item</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
            Agency FAQs
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section id="contact" className="bg-primary-700 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Ready to Add This to Your Offering?
          </h2>
          <p className="mt-3 text-lg text-primary-100">
            Tell us how many stores you manage and we'll set up wholesale access.
          </p>
          <div className="mt-8">
            <Link to="/contact">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 focus:ring-white">
                <Shield className="mr-2 h-5 w-5" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="border-t border-gray-200 bg-white px-4 py-6 sm:px-6 lg:px-8">
        <p className="mx-auto max-w-3xl text-center text-xs text-gray-400">
          <strong>Legal Disclaimer:</strong> SiteSafe does not guarantee ADA compliance or legal protection.
          Lawsuit statistics referenced on this page are informational, not legal advice. Consult an accessibility
          specialist or attorney for full compliance guidance.
        </p>
      </div>
    </div>
  )
}
