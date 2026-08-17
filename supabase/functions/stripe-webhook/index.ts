import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const VALID_PLANS = ['free', 'fix-my-site', 'compliance-shield']

// Partner commission rates — 40% one-time on Fix My Site (higher % because the
// dollar amount is small), 20% recurring on Compliance Shield (paid again on
// every renewal, since referred_by persists in the Stripe subscription metadata).
const COMMISSION_RATES: Record<string, number> = {
  'fix-my-site': 0.40,
  'compliance-shield': 0.20,
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const COMMISSION_ALERT_EMAIL = 'codebake.SaaS@outlook.com'

async function sendCommissionAlert(referredBy: string, planId: string, amountCents: number, commissionCents: number, isRenewal: boolean) {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping commission alert email')
    return
  }
  const dollars = (n: number) => (n / 100).toFixed(2)
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SiteSafe <outreach@adalawsuitcheck.com>',
        to: COMMISSION_ALERT_EMAIL,
        subject: `Commission owed: $${dollars(commissionCents)} to "${referredBy}"`,
        text: `Partner: ${referredBy}\nPlan: ${planId}\nType: ${isRenewal ? 'renewal' : 'new sale'}\nCustomer paid: $${dollars(amountCents)}\nCommission owed: $${dollars(commissionCents)}\n\nMark it paid once sent: Supabase Table Editor -> purchases -> find this row -> toggle "paid".`,
      }),
    })
  } catch (e) {
    console.error('Failed to send commission alert email:', e)
  }
}

const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

if (!stripeKey || !endpointSecret) {
  console.error('Missing required env vars: STRIPE_SECRET_KEY and/or STRIPE_WEBHOOK_SECRET')
}

const stripe = new Stripe(stripeKey!)

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

async function activatePlan(userId: string, planId: string, paymentId: string, amount: number | null, referredBy?: string, isRenewal = false) {
  if (!VALID_PLANS.includes(planId)) {
    console.error(`Invalid plan ID received: ${planId}`)
    return
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ plan: planId })
    .eq('id', userId)

  if (profileError) {
    console.error('Failed to update profile:', profileError)
  }

  // Computed and stored at the time of sale, not recalculated later — if the
  // commission rate changes in the future, past sales keep showing what was
  // actually owed at the time.
  const commissionAmount = referredBy && amount != null
    ? Math.round(amount * (COMMISSION_RATES[planId] ?? 0))
    : null

  const { error: purchaseError } = await supabase.from('purchases').insert({
    user_id: userId,
    plan: planId,
    stripe_payment_id: paymentId,
    amount,
    referred_by: referredBy || null,
    commission_amount: commissionAmount,
  })

  if (purchaseError) {
    console.error('Failed to record purchase:', purchaseError)
  }

  if (referredBy && amount != null && commissionAmount != null) {
    await sendCommissionAlert(referredBy, planId, amount, commissionAmount, isRenewal)
  }
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
    // Must use constructEventAsync in Deno (SubtleCrypto is async-only)
    event = await stripe.webhooks.constructEventAsync(body, signature, endpointSecret)
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'unknown error'}`, { status: 400 })
  }

  try {
    switch (event.type) {
      // One-time payment completed
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.payment_status !== 'paid') {
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
          session.metadata?.referred_by,
          false,
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
        const paymentIntent = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent?.id || `invoice_${invoice.id}`
        await activatePlan(userId, planId, paymentIntent, invoice.amount_paid, sub.metadata?.referred_by, true)
        break
      }

      // Subscription cancelled or expired
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.supabase_user_id

        if (!userId) break

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
