import { corsHeaders } from '../_shared/cors.ts'
import { getPayPalAccessToken, getPayPalApiUrl } from '../_shared/paypal.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const VALID_PLANS = ['fix-my-site', 'compliance-shield']

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

    // Use anon key for auth check
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { orderId, planId } = await req.json()

    if (!orderId || !planId || !VALID_PLANS.includes(planId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid order or plan' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = await getPayPalAccessToken()
    const apiUrl = getPayPalApiUrl()

    // Capture the order
    const captureRes = await fetch(`${apiUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!captureRes.ok) {
      const text = await captureRes.text()
      console.error('PayPal capture failed:', text)
      throw new Error('Failed to capture PayPal payment')
    }

    const capture = await captureRes.json()

    if (capture.status !== 'COMPLETED') {
      console.error('PayPal capture not completed:', capture.status)
      return new Response(
        JSON.stringify({ error: 'Payment not completed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify amount
    const capturedAmount = parseFloat(
      capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || '0'
    )
    const expectedAmount = PLAN_PRICES[planId]

    if (capturedAmount < expectedAmount) {
      console.error(`Amount mismatch: captured=${capturedAmount}, expected=${expectedAmount}`)
      return new Response(
        JSON.stringify({ error: 'Payment amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify custom_id matches user
    const customId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
      || capture.purchase_units?.[0]?.custom_id
    if (customId) {
      const [captureUserId] = customId.split('|')
      if (captureUserId !== user.id) {
        console.error(`User mismatch: capture=${captureUserId}, auth=${user.id}`)
        return new Response(
          JSON.stringify({ error: 'User mismatch' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Use service role to update profile and insert purchase
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const paypalCaptureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId

    // Update user's plan
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ plan: planId })
      .eq('id', user.id)

    if (profileError) {
      console.error('Failed to update profile:', profileError)
    }

    // Record the purchase
    const { error: purchaseError } = await supabaseAdmin.from('purchases').insert({
      user_id: user.id,
      plan: planId,
      stripe_payment_id: `paypal_${paypalCaptureId}`,
      amount: Math.round(capturedAmount * 100), // Store in cents like Stripe
    })

    if (purchaseError) {
      console.error('Failed to record purchase:', purchaseError)
    }

    console.log(`PayPal purchase recorded: user=${user.id}, plan=${planId}, capture=${paypalCaptureId}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('paypal-capture-order error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
