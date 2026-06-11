import Stripe from 'npm:stripe@14'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('DUTY_STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-04-10' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { plan, family_id } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: family } = await supabase
    .from('duty_families')
    .select('stripe_customer_id, name')
    .eq('id', family_id)
    .single()

  // Reuse or create Stripe customer
  let customerId = family?.stripe_customer_id
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: family?.name ?? 'Duty Family',
      metadata: { duty_family_id: family_id },
    })
    customerId = customer.id
    await supabase.from('duty_families').update({ stripe_customer_id: customerId }).eq('id', family_id)
  }

  const priceId = plan === 'annual'
    ? Deno.env.get('DUTY_STRIPE_PRICE_ANNUAL')
    : Deno.env.get('DUTY_STRIPE_PRICE_MONTHLY')

  const origin = 'https://duty.leftfieldapps.com'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId!, quantity: 1 }],
    success_url: `${origin}/parent/settings?upgraded=1`,
    cancel_url: `${origin}/parent/upgrade`,
    subscription_data: { metadata: { duty_family_id: family_id } },
  })

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
