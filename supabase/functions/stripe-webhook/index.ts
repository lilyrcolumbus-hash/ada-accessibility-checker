import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const VALID_PLANS = ['free', 'fix-my-site', 'compliance-shield']

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!stripeKey || !endpointSecret) {
  console.error('Missing required env vars: STRIPE_SECRET_KEY and/or STRIPE_WEBHOOK_SECRET')
}

const stripe = new Stripe(stripeKey!, {
  apiVersion: '2026-02-25' as any,
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function activatePlan(userId: string, planId: string, paymentId: string, amount: number | null) {
  if (!VALID_PLANS.includes(planId)) {
    console.error(`Invalid plan ID received: ${planId}`)
    return
  }

  console.log(`Activating plan: user=${userId}, plan=${planId}, payment=${paymentId}`)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ plan: planId })
    .eq('id', userId)

  if (profileError) {
    console.error('Failed to update profile:', profileError)
  }

  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId,
    plan: planId,
    stripe_payment_id: paymentId,
    amount,
  })

  if (purchaseError) {
    console.error('Failed to record purchase:', purchaseError)
  }

  console.log(`Plan activated successfully: user=${userId}, plan=${planId}`)
}

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
    switch (event.type) {
      // One-time payment completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== 'paid') {
          console.log('Session not paid, skipping:', session.id)
          break
        }

        const userId = session.metadata?.supabase_user_id
        const planId = session.metadata?.plan_id || 'fix-my-site'

        if (!userId) {
          console.warn('No user ID in webhook metadata:', session.id)
          break
        }

        await activatePlan(
          userId,
          planId,
          (session.payment_intent as string) || session.subscription as string || session.id,
          session.amount_total,
        )
        break
      }

      // Subscription renewed (subsequent payments)
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (!invoice.subscription) break

        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string)
        const userId = sub.metadata?.supabase_user_id
        const planId = sub.metadata?.plan_id

        if (!userId || !planId) {
          console.warn('No metadata on subscription:', sub.id)
          break
        }

        // Re-activate plan on renewal
        await activatePlan(userId, planId, invoice.payment_intent as string, invoice.amount_paid)
        break
      }

      // Subscription cancelled or expired
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id

        if (!userId) break

        console.log(`Subscription cancelled: user=${userId}, sub=${sub.id}`)

        const { error } = await supabase
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', userId)

        if (error) {
          console.error('Failed to downgrade profile:', error)
        }
        break
      }
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
