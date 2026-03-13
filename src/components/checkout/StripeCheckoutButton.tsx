import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'

interface StripeCheckoutButtonProps {
  planId: string
  priceId: string
}

async function getValidToken(): Promise<string | null> {
  const { supabase } = await import('@/lib/supabase')

  // Try refresh first (gets a fresh, non-expired token)
  try {
    const result = await Promise.race([
      supabase.auth.refreshSession(),
      new Promise<{ data: { session: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null } }), 3000)
      ),
    ])
    if (result.data.session?.access_token) {
      return result.data.session.access_token
    }
  } catch {
    // refresh failed
  }

  // Fallback: cached session (may be expired but worth trying)
  try {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  } catch {
    return null
  }
}

export default function StripeCheckoutButton({ planId, priceId }: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getValidToken()

      if (!token) {
        setError('Session expired — please log out and log in again.')
        setLoading(false)
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

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
        // If 401, the token was expired — tell user to re-login
        if (res.status === 401) {
          setError('Session expired — please log out and log in again.')
        } else {
          setError(data.error || `Payment failed (${res.status})`)
        }
        setLoading(false)
        return
      }

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
