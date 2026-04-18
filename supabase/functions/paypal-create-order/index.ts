import { corsHeaders } from '../_shared/cors.ts'
import { getPayPalAccessToken, getPayPalApiUrl } from '../_shared/paypal.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const PLAN_PRICES: Record<string, number> = {
  'fix-my-site': 49,
  'compliance-shield': 199,
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { planId } = await req.json()
    const price = PLAN_PRICES[planId]

    if (!price) {
      return new Response(
        JSON.stringify({ error: 'Invalid plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const apiUrl = getPayPalApiUrl()

    const orderRes = await fetch(`${apiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: price.toFixed(2),
          },
          description: `SiteSafe ${planId === 'compliance-shield' ? 'Compliance Shield (1 year)' : 'Fix My Site'}`,
          custom_id: `${user.id}|${planId}`,
        }],
      }),
    })

    if (!orderRes.ok) {
      const text = await orderRes.text()
      console.error('PayPal create order failed:', text)
      throw new Error('Failed to create PayPal order')
    }

    const order = await orderRes.json()

    return new Response(
      JSON.stringify({ orderId: order.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('paypal-create-order error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create PayPal order. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
