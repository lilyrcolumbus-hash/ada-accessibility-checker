import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { REF_CODE_STORAGE_KEY } from '@/hooks/useReferralCapture'

interface StripeCheckoutButtonProps {
  planId: string
  priceId: string
}

export default function StripeCheckoutButton({ planId, priceId }: StripeCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      // Read token directly from localStorage (fastest, no async hanging)
      const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'))
      let token: string | null = null

      if (storageKey) {
        try {
          const raw = localStorage.getItem(storageKey)
          if (raw) {
            const parsed = JSON.parse(raw)
            token = parsed.access_token ?? null
          }
        } catch {
          // parse failed
        }
      }

      if (!token) {
        setError('Not logged in. Redirecting to login...')
        setLoading(false)
        setTimeout(() => navigate('/login'), 1500)
        return
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      if (!supabaseUrl) {
        setError('Payment service not configured. Please try again later.')
        setLoading(false)
        return
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(
        `${supabaseUrl}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            priceId,
            planId,
            refCode: sessionStorage.getItem(REF_CODE_STORAGE_KEY) || undefined,
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)

      const data = await res.json()

      if (res.status === 401) {
        // Token expired — force re-login
        setError('Session expired. Redirecting to login...')
        setLoading(false)
        sessionStorage.setItem('sitesafe_pending_plan', planId)
        setTimeout(() => navigate('/login'), 1500)
        return
      }

      if (!res.ok || !data.url) {
        setError(data.error || `Payment failed (${res.status})`)
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
