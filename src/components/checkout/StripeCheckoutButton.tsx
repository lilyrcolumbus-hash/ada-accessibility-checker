import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'

interface StripeCheckoutButtonProps {
  planId: string
  priceId: string
}

export default function StripeCheckoutButton({ planId, priceId }: StripeCheckoutButtonProps) {
  const { getAccessToken, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      let token: string | null = null
      try {
        token = await getAccessToken()
      } catch {
        // Token refresh failed — force re-login
      }

      if (!token) {
        // Auto sign out and redirect to login, preserving the checkout plan
        sessionStorage.setItem('sitesafe_pending_plan', planId)
        try { await signOut() } catch {}
        window.location.href = `/login`
        return
      }

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15_000)

      let res: Response
      try {
        res = await fetch(
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
      } catch (fetchErr) {
        if ((fetchErr as Error).name === 'AbortError') {
          throw new Error('Request timed out — please try again')
        }
        throw new Error('Network error — check your connection and try again')
      } finally {
        clearTimeout(timeout)
      }

      let data: Record<string, unknown>
      const text = await res.text()
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error(`Server error — please try again`)
      }

      if (!res.ok || !data.url) {
        if (res.status === 401) {
          // Token was accepted by getAccessToken but rejected by Supabase edge function
          // Force re-login
          sessionStorage.setItem('sitesafe_pending_plan', planId)
          try { await signOut() } catch {}
          window.location.href = `/login`
          return
        }
        throw new Error(
          (data.error as string) || `Something went wrong — please try again`
        )
      }

      window.location.href = data.url as string
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
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
        <p className="mt-2 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
}
