import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const VALID_PLANS = ['free', 'full-report', 'agency']

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!stripeKey || !endpointSecret) {
  console.error('Missing required env vars: STRIPE_SECRET_KEY and/or STRIPE_WEBHOOK_SECRET')
}

const stripe = new Stripe(stripeKey!, {
  apiVersion: '2023-10-16',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (!endpointSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return new Response(
      JSON.stringify({ error: 'Webhook not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      if (session.payment_status !== 'paid') {
        console.log('Session not paid, skipping:', session.id)
        return new Response('OK')
      }

      const userId = session.metadata?.supabase_user_id
      const planId = session.metadata?.plan_id || 'full-report'

      if (!userId) {
        console.warn('No user ID in webhook metadata:', session.id)
        return new Response('OK')
      }

      if (!VALID_PLANS.includes(planId)) {
        console.error(`Invalid plan ID received: ${planId}, session: ${session.id}`)
        return new Response('OK')
      }

      console.log(`Processing purchase: user=${userId}, plan=${planId}, session=${session.id}`)

      // Update user's plan
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ plan: planId })
        .eq('id', userId)

      if (profileError) {
        console.error('Failed to update profile:', profileError)
      }

      // Record the purchase
      const { error: purchaseError } = await supabase.from('purchases').insert({
        user_id: userId,
        plan: planId,
        stripe_payment_id: session.payment_intent as string,
        amount: session.amount_total,
      })

      if (purchaseError) {
        console.error('Failed to record purchase:', purchaseError)
      }

      console.log(`Purchase recorded successfully: user=${userId}, plan=${planId}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook handler error:', error)
    // Return 200 to prevent Stripe from retrying indefinitely
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed', logged: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
