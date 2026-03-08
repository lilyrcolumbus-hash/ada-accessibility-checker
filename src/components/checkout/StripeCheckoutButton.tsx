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
      // Get token directly from Supabase — bypass AuthContext entirely
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.access_token) {
        // Try refresh
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        if (!refreshed?.access_token) {
          throw new Error('Please log in to continue')
        }
        // Use refreshed token
        await callCheckout(refreshed.access_token)
        return
      }

      // Try with cached token first
      const result = await callCheckout(session.access_token)

      // If 401, try with refreshed token
      if (result === 'unauthorized') {
        const { data: { session: refreshed } } = await supabase.auth.refreshSession()
        if (!refreshed?.access_token) {
          throw new Error('Session expired — please log out and log in again')
        }
        const retryResult = await callCheckout(refreshed.access_token)
        if (retryResult === 'unauthorized') {
          throw new Error('Authentication failed — please log out and log in again')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const callCheckout = async (token: string): Promise<'success' | 'unauthorized'> => {
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

      if (res.status === 401) return 'unauthorized'

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe
      window.location.href = data.url
      return 'success'
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        throw new Error('Request timed out — please try again')
      }
      throw err
    } finally {
      clearTimeout(timeout)
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
        <p className="mt-2 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
}
