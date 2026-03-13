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
      // Always get a fresh token
      const { supabase } = await import('@/lib/supabase')

      let token: string | null = null

      // Try refresh first (gets a fresh token)
      try {
        const { data } = await Promise.race([
          supabase.auth.refreshSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 8000)
          ),
        ])
        token = data.session?.access_token ?? null
      } catch {
        // Refresh failed or timed out — try cached session
        const { data } = await supabase.auth.getSession()
        token = data.session?.access_token ?? null
      }

      if (!token) {
        throw new Error('Please log out and log in again to continue.')
      }

      // Call the edge function
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15_000)

      try {
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

        const data = await res.json()

        if (res.status === 401) {
          throw new Error('Session expired — please log out and log in again.')
        }

        if (!res.ok || !data.url) {
          throw new Error(data.error || `Checkout failed (${res.status})`)
        }

        // Redirect to Stripe Checkout
        window.location.href = data.url
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          throw new Error('Request timed out — please try again.')
        }
        throw err
      } finally {
        clearTimeout(timeout)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
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
