import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Shield, Check, CheckCircle, ArrowLeft } from 'lucide-react'
import { getPlan, PLANS } from '@/config/plans'
import { useSubscription } from '@/hooks/useSubscription'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import StripeCheckoutButton from '@/components/checkout/StripeCheckoutButton'
import PayPalCheckoutButton from '@/components/checkout/PayPalCheckoutButton'
import Button from '@/components/ui/Button'
import { useEffect } from 'react'

const PLAN_KEY = 'sitesafe_pending_plan'

export function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { plan: currentPlan, isPaid, isLoading } = useSubscription()

  // Read plan from URL or sessionStorage
  const planId = searchParams.get('plan') || sessionStorage.getItem(PLAN_KEY) || ''
  const plan = getPlan(planId)
  const isPaidPlan = plan.id !== 'free' && plan.price > 0

  // Clean up sessionStorage once we've read it
  useEffect(() => {
    sessionStorage.removeItem(PLAN_KEY)
  }, [])

  // No valid paid plan → redirect to pricing
  useEffect(() => {
    if (!isPaidPlan) {
      navigate('/#pricing', { replace: true })
    }
  }, [isPaidPlan, navigate])

  if (!isPaidPlan) return null
  if (isLoading) return null

  // User already has this plan or a higher plan
  const alreadyHasPlan = currentPlan.id === plan.id
  const hasHigherPlan = currentPlan.id === 'compliance-shield' && plan.id === 'fix-my-site'

  if (alreadyHasPlan || hasHigherPlan) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="p-3 bg-success-50 rounded-full">
              <CheckCircle className="h-10 w-10 text-success-500" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              You already have the {currentPlan.name} plan
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              {hasHigherPlan
                ? 'Your Compliance Shield plan already includes everything in Fix My Site.'
                : 'Your plan is active. Go to your dashboard to start scanning.'}
            </p>
          </div>
          <Link to="/dashboard">
            <Button variant="primary" size="md">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      {/* Back navigation */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
        <Link to="/" className="flex items-center gap-2 text-primary-700">
          <Shield className="h-5 w-5" />
          <span className="text-sm font-bold">SiteSafe</span>
        </Link>
      </div>

      <div className="w-full max-w-lg space-y-6">
        {/* Plan summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Complete your purchase</h1>
                <p className="text-sm text-gray-500">
                  {plan.billing === 'yearly' ? 'Annual subscription — cancel anytime' : 'One-time payment — no subscription'}
                </p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Plan details */}
            <div className="rounded-xl border border-primary-200 bg-primary-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-gray-900">{plan.name}</h2>
                <div className="text-right">
                  <span className="text-2xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">
                    {plan.billing === 'yearly' ? '/year' : 'one-time'}
                  </span>
                </div>
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-700">
                    <Check className="h-4 w-4 flex-shrink-0 text-primary-600" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-sm text-gray-500">Choose payment method</span>
              </div>
            </div>

            {/* Payment buttons */}
            <div className="space-y-4">
              <StripeCheckoutButton planId={plan.id} priceId={plan.priceId} />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">or</span>
                </div>
              </div>

              <PayPalCheckoutButton planId={plan.id} price={plan.price} />
            </div>
          </CardContent>
        </Card>

        {/* Trust signals */}
        <p className="text-center text-xs text-gray-400">
          Secure payment processed by Stripe or PayPal. Your financial data never touches our servers.
        </p>
      </div>
    </div>
  )
}
