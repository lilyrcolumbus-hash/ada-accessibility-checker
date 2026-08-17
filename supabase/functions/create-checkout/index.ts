import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!)

// Plans that use subscription mode in Stripe
const SUBSCRIPTION_PLANS = ['compliance-shield']

const REF_CODE_PATTERN = /^[a-zA-Z0-9-]{1,40}$/

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

    const { priceId, planId, refCode } = await req.json()
    const VALID_PLANS = ['fix-my-site', 'compliance-shield']
    if (!priceId || !planId || !VALID_PLANS.includes(planId)) {
      return new Response(
        JSON.stringify({ error: 'Valid price ID and plan ID are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    // Client-supplied — validate rather than trust, same pattern as the frontend capture
    const referredBy = typeof refCode === 'string' && REF_CODE_PATTERN.test(refCode) ? refCode : undefined

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const isSubscription = SUBSCRIPTION_PLANS.includes(planId)
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'https://adalawsuitcheck.com'

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?payment=success&plan=${planId}`,
      cancel_url: `${origin}/#pricing`,
      metadata: {
        supabase_user_id: user.id,
        plan_id: planId || 'fix-my-site',
        ...(referredBy && { referred_by: referredBy }),
      },
      ...(isSubscription && {
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            plan_id: planId,
            ...(referredBy && { referred_by: referredBy }),
          },
        },
      }),
    })

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
