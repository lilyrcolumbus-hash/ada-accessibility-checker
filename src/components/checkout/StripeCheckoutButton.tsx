import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface StripeCheckoutButtonProps {
  planId: string
  priceId: string
}

export default function StripeCheckoutButton({ planId, priceId }: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase')

      // Get token — try getSession first (fast), then refresh if expired
      const { data: sessionData } = await supabase.auth.getSession()
      let token = sessionData.session?.access_token ?? null

      // If token exists but might be expired, try a quick refresh
      if (!token) {
        try {
          const { data: refreshData } = await supabase.auth.refreshSession()
          token = refreshData.session?.access_token ?? null
        } catch {
          // refresh failed
        }
      }

      if (!token) {
        setError('Session expired — please log out and log in again.')
        setLoading(false)
        return
      }

      // Call edge function with 10s timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10_000)

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priceId, planId }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)

      const data = await res.json()

      if (!res.ok || !data.url) {
        setError(data.error || `Payment failed (${res.status}). Please try again.`)
        setLoading(false)
        return
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err) {
      const msg = err instanceof Error && err.name === 'AbortError'
        ? 'Request timed out — please try again.'
        : err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="primary"
        size="lg"
        className="w-full gap-2"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <CreditCard className="h-5 w-5" />
        )}
        {loading ? 'Redirecting to Stripe...' : 'Pay with Card'}
      </Button>
      {error && (
        <p className="mt-3 rounded-lg border border-danger-200 bg-danger-50 px-4 py-2.5 text-sm text-danger-700">
          {error}
        </p>
      )}
    </div>
  )
}
