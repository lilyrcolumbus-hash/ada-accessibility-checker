import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Button from '@/components/ui/Button'

interface StripeCheckoutButtonProps {
  planId: string
  priceId: string
}

export default function StripeCheckoutButton({ planId, priceId }: StripeCheckoutButtonProps) {
  const { getAccessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAccessToken()
      if (!token) throw new Error('Please log in to continue')

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priceId, planId }),
        }
      )

      const data = await res.json()

      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      window.location.href = data.url
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
