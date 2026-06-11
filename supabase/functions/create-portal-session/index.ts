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

  const { family_id } = await req.json().catch(() => ({}))
  if (!family_id) return json({ error: 'Invalid request' }, 400)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Authorize: caller must be a parent of this family (same guard as checkout).
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
    .select('stripe_customer_id')
    .eq('id', family_id)
    .single()

  if (!family?.stripe_customer_id) return json({ error: 'No subscription to manage' }, 400)

  const session = await stripe.billingPortal.sessions.create({
    customer: family.stripe_customer_id,
    return_url: 'https://duty.leftfieldapps.com/parent/settings',
  })

  return json({ url: session.url })
})
