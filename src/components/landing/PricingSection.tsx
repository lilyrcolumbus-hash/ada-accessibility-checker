import { Check, X, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface FeatureRow {
  label: string
  free: boolean | string
  full: boolean | string
  agency: boolean | string
}

const FEATURES: FeatureRow[] = [
  { label: 'Pages scanned',           free: '1 page',     full: 'Up to 50',       agency: 'Unlimited' },
  { label: 'Compliance score',        free: true,          full: true,              agency: true },
  { label: 'Risk assessment',         free: true,          full: true,              agency: true },
  { label: 'Issues found',            free: '3 visible',   full: 'All visible',     agency: 'All visible' },
  { label: 'Plain English explanations', free: '3 issues', full: true,              agency: true },
  { label: 'Copy-paste code fixes',   free: '1 fix',       full: 'All fixes',       agency: 'All fixes' },
  { label: 'Prioritized action plan', free: false,          full: true,              agency: true },
  { label: 'Cost & time estimate',    free: true,           full: true,              agency: true },
  { label: 'Shareable report link',   free: false,          full: true,              agency: true },
  { label: 'Re-scan after fixes',     free: false,          full: '1 included',      agency: '3 per site' },
  { label: 'Number of websites',      free: '1',            full: '1',               agency: 'Up to 10' },
  { label: 'Compliance badge',        free: false,          full: false,             agency: true },
]

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="h-5 w-5 text-success-500 mx-auto" />
  if (value === false) return <X className="h-5 w-5 text-gray-300 mx-auto" />
  return <span className="text-sm font-medium text-gray-700">{value}</span>
}

export function PricingSection() {
  return (
    <section id="pricing" className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple, One-Time Pricing
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            No subscriptions. No monthly fees. Pay once, get your full report.
          </p>
        </div>

        {/* Pricing cards header */}
        <div className="grid grid-cols-4 gap-0">
          {/* Empty top-left cell */}
          <div />

          {/* Free */}
          <div className="text-center px-2 pb-4">
            <h3 className="text-base font-semibold text-gray-900">Free Scan</h3>
            <div className="mt-2">
              <span className="text-3xl font-extrabold text-gray-900">$0</span>
            </div>
            <Link to="/#hero" className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full">
                Scan Free
              </Button>
            </Link>
          </div>

          {/* Full Report — popular */}
          <div className="relative text-center px-2 pb-4 bg-primary-50 rounded-t-xl border-x-2 border-t-2 border-primary-600">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow">
                Best Value
              </span>
            </div>
            <h3 className="text-base font-semibold text-gray-900 pt-2">Full Report</h3>
            <div className="mt-2 flex items-end justify-center gap-1">
              <span className="text-3xl font-extrabold text-gray-900">$49</span>
              <span className="text-xs text-gray-400 mb-1">one-time</span>
            </div>
            <Link to="/register?plan=full-report" className="mt-4 block">
              <Button variant="primary" size="sm" className="w-full">
                Get Full Report
              </Button>
            </Link>
          </div>

          {/* Agency */}
          <div className="text-center px-2 pb-4">
            <h3 className="text-base font-semibold text-gray-900">Agency Pack</h3>
            <div className="mt-2 flex items-end justify-center gap-1">
              <span className="text-3xl font-extrabold text-gray-900">$199</span>
              <span className="text-xs text-gray-400 mb-1">one-time</span>
            </div>
            <Link to="/register?plan=agency" className="mt-4 block">
              <Button variant="outline" size="sm" className="w-full">
                Get Agency Pack
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature comparison table */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          {FEATURES.map((feature, i) => (
            <div
              key={feature.label}
              className={cn(
                'grid grid-cols-4 gap-0',
                i % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                i !== FEATURES.length - 1 && 'border-b border-gray-100',
              )}
            >
              {/* Feature label */}
              <div className="px-4 py-3 text-sm text-gray-700 font-medium flex items-center">
                {feature.label}
              </div>

              {/* Free */}
              <div className="px-2 py-3 text-center flex items-center justify-center">
                <CellValue value={feature.free} />
              </div>

              {/* Full Report — highlighted column */}
              <div className="px-2 py-3 text-center flex items-center justify-center bg-primary-50/50 border-x-2 border-primary-600/20">
                <CellValue value={feature.full} />
              </div>

              {/* Agency */}
              <div className="px-2 py-3 text-center flex items-center justify-center">
                <CellValue value={feature.agency} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom price anchoring */}
        <div className="mt-8 rounded-xl bg-danger-50 border border-danger-200 px-6 py-4 text-center">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-danger-700">Average ADA lawsuit settlement: $10,000–$20,000.</span>
            {' '}Average defense cost: $50,000+.{' '}
            <span className="font-semibold">A $49 report is the cheapest insurance you can get.</span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          One-time payment. No recurring charges. Come back anytime for a new scan.
        </p>
      </div>
    </section>
  )
}
