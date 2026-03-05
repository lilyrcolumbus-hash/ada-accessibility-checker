import { Check, Shield, Zap, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PLANS } from '@/config/plans'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const PLAN_ICONS = [Eye, Zap, Shield]

const PRICE_LABELS: Record<string, string> = {
  free: '',
  'one-time': 'one-time',
  yearly: '/year',
}

export function PricingSection() {
  const { user } = useAuth()
  const getLink = (planId: string) => {
    if (planId === 'free') return '/#hero'
    return user ? `/checkout?plan=${planId}` : `/register?plan=${planId}`
  }

  return (
    <section id="pricing" className="bg-gray-50 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Heading */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 text-lg text-gray-500">
            No hidden fees. No overlays. Real code fixes that actually work.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan, i) => {
            const Icon = PLAN_ICONS[i]
            const isPopular = plan.popular

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md',
                  isPopular
                    ? 'border-primary-600 ring-2 ring-primary-600 shadow-md'
                    : 'border-gray-200',
                )}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Header */}
                <div className="mb-5">
                  <div className={cn(
                    'mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl',
                    isPopular ? 'bg-primary-100' : 'bg-gray-100',
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      isPopular ? 'text-primary-600' : 'text-gray-600',
                    )} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-5">
                  {plan.billing === 'yearly' ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">
                          ${Math.round(plan.price / 12)}
                        </span>
                        <span className="text-sm text-gray-500">/month</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        Billed annually at <span className="font-semibold text-gray-700">${plan.price}/year</span>
                      </p>
                      <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-50 border border-success-200 px-2.5 py-1">
                        <span className="text-xs font-bold text-success-700">
                          Save 66% vs accessiBe ($490+/yr)
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-gray-900">
                          {plan.price === 0 ? '$0' : `$${plan.price}`}
                        </span>
                        {PRICE_LABELS[plan.billing] && (
                          <span className="text-sm text-gray-500">
                            {PRICE_LABELS[plan.billing]}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* CTA */}
                <Link to={getLink(plan.id)} className="mb-6 block">
                  <Button
                    variant={isPopular ? 'primary' : 'outline'}
                    size="md"
                    className="w-full"
                  >
                    {plan.price === 0 ? 'Scan Free' : plan.billing === 'yearly' ? 'Get Protected' : 'Fix My Site'}
                  </Button>
                </Link>

                {/* Features */}
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className={cn(
                        'mt-0.5 h-4 w-4 flex-shrink-0',
                        isPopular ? 'text-primary-600' : 'text-success-500',
                      )} />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        {/* Competitor comparison */}
        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-gray-500">
            Why choose SiteSafe over overlays?
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-4 text-center">
              <p className="text-sm font-bold text-danger-700">accessiBe</p>
              <p className="text-xs text-gray-600 mt-1">$490+/year — overlay — fined $1M by FTC</p>
            </div>
            <div className="rounded-lg bg-danger-50 border border-danger-200 p-4 text-center">
              <p className="text-sm font-bold text-danger-700">UserWay</p>
              <p className="text-xs text-gray-600 mt-1">$588+/year — overlay — doesn't fix your code</p>
            </div>
            <div className="rounded-lg bg-success-50 border border-success-200 p-4 text-center">
              <p className="text-sm font-bold text-success-700">SiteSafe</p>
              <p className="text-xs text-gray-600 mt-1">$49 once or $199/year — real code fixes</p>
            </div>
          </div>
        </div>

        {/* Bottom price anchoring */}
        <div className="mt-6 rounded-xl bg-danger-50 border border-danger-200 px-6 py-4 text-center">
          <p className="text-sm text-gray-700">
            <span className="font-bold text-danger-700">Average ADA lawsuit settlement: $10,000–$20,000.</span>
            {' '}Average defense cost: $50,000+.{' '}
            <span className="font-semibold">A $49 report is the cheapest insurance you can get.</span>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          No overlays. No fake fixes. Real code changes that make your site truly accessible.
        </p>
      </div>
    </section>
  )
}
