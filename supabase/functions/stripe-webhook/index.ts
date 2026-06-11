import Stripe from 'npm:stripe@14'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('DUTY_STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-04-10' })
const webhookSecret = Deno.env.get('DUTY_STRIPE_WEBHOOK_SECRET') ?? ''

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature') ?? ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return new Response('Bad signature', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  async function upsertPremium(sub: Stripe.Subscription) {
    const familyId = sub.metadata?.duty_family_id
    if (!familyId) return

    const status = sub.status === 'active' || sub.status === 'trialing' ? 'active'
      : sub.status === 'past_due' ? 'past_due'
      : 'canceled'

    await supabase.from('duty_families').update({
      premium_status: status,
      premium_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
      stripe_subscription_id: sub.id,
    }).eq('id', familyId)
  }

  async function cancelPremium(sub: Stripe.Subscription) {
    const familyId = sub.metadata?.duty_family_id
    if (!familyId) return
    await supabase.from('duty_families').update({
      premium_status: 'canceled',
      premium_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
    }).eq('id', familyId)
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await upsertPremium(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await cancelPremium(event.data.object as Stripe.Subscription)
      break
  }

  return new Response('ok')
})
