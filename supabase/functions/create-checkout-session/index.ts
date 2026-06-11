import Stripe from 'npm:stripe@14'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('DUTY_STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-04-10' })

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { plan, family_id } = await req.json().catch(() => ({}))
  if (!family_id || (plan !== 'monthly' && plan !== 'annual')) {
    return json({ error: 'Invalid request' }, 400)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Authorize: the caller must be a parent of this family. verify_jwt only proves
  // *a* valid user — without this, any authenticated user could open checkout or
  // set a Stripe customer on a family they don't belong to (IDOR).
  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const { data: membership } = await supabase
    .from('duty_profiles')
    .select('id')
    .eq('id', user.id)
    .eq('family_id', family_id)
    .eq('role', 'parent')
    .maybeSingle()
  if (!membership) return json({ error: 'Forbidden' }, 403)

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

  return json({ url: session.url })
})
