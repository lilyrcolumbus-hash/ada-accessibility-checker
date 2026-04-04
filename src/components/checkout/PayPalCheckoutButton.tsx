import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import { useAuth } from '@/contexts/AuthContext'

interface PayPalCheckoutButtonProps {
  planId: string
  price: number
}

export default function PayPalCheckoutButton({ planId, price }: PayPalCheckoutButtonProps) {
  const { getAccessToken, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

  if (!clientId || clientId === 'your_paypal_client_id_here' || !supabaseUrl) {
    return null
  }

  return (
    <div>
      <PayPalScriptProvider options={{ clientId, currency: 'USD', intent: 'capture' }}>
        <PayPalButtons
          style={{ layout: 'horizontal', color: 'gold', shape: 'rect', label: 'paypal', height: 48 }}
          createOrder={async () => {
            setError(null)
            const token = await getAccessToken()
            if (!token) throw new Error('Please log in to continue')
            const res = await fetch(`${supabaseUrl}/functions/v1/paypal-create-order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ planId }),
            })
            const data = await res.json()
            if (!res.ok || !data.orderId) {
              throw new Error(data.error || 'Failed to create PayPal order')
            }
            return data.orderId
          }}
          onApprove={async (data) => {
            try {
              const token = await getAccessToken()
              if (!token) throw new Error('Please log in to continue')
              const res = await fetch(`${supabaseUrl}/functions/v1/paypal-capture-order`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ orderId: data.orderID, planId }),
              })
              const result = await res.json()
              if (!res.ok || !result.success) {
                throw new Error(result.error || 'Payment capture failed')
              }
              await refreshProfile()
              navigate(`/dashboard?payment=success&plan=${planId}`)
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Payment failed')
            }
          }}
          onError={(err) => {
            setError(err?.toString() || 'PayPal error')
          }}
        />
      </PayPalScriptProvider>
      {error && (
        <p className="mt-2 text-sm text-danger-600">{error}</p>
      )}
      <p className="mt-2 text-center text-xs text-gray-400">
        You'll be charged ${price} USD via PayPal
      </p>
    </div>
  )
}
