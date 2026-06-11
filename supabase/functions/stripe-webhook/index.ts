import Stripe from 'npm:stripe@14'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('DUTY_STRIPE_SECRET_KEY') ?? '', { apiVersion: '2024-04-10' })
const webhookSecret = Deno.env.get('DUTY_STRIPE_WEBHOOK_SECRET') ?? ''

// current_period_end lives on the subscription in API 2024-04-10, but moved onto
// subscription items in later versions — read both so a future API bump can't
// silently write null period ends.
function periodEndISO(sub: Stripe.Subscription): string | null {
  const ts = (sub as any).current_period_end
    ?? (sub as any).items?.data?.[0]?.current_period_end
  return ts ? new Date(ts * 1000).toISOString() : null
}

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature') ?? ''
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret)
  } catch {
    return new Response('Bad signature', { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  async function upsertPremium(sub: Stripe.Subscription) {
    const familyId = sub.metadata?.duty_family_id
    if (!familyId) {
      console.error('subscription missing duty_family_id metadata', sub.id)
      return
    }

    const status = sub.status === 'active' || sub.status === 'trialing' ? 'active'
      : sub.status === 'past_due' ? 'past_due'
      : 'canceled'

    const { error } = await supabase.from('duty_families').update({
      premium_status: status,
      premium_period_end: periodEndISO(sub),
      stripe_subscription_id: sub.id,
    }).eq('id', familyId)
    if (error) console.error('upsertPremium update failed', familyId, error.message)
  }

  async function cancelPremium(sub: Stripe.Subscription) {
    const familyId = sub.metadata?.duty_family_id
    if (!familyId) {
      console.error('subscription missing duty_family_id metadata', sub.id)
      return
    }
    const { error } = await supabase.from('duty_families').update({
      premium_status: 'canceled',
      premium_period_end: periodEndISO(sub),
    }).eq('id', familyId)
    if (error) console.error('cancelPremium update failed', familyId, error.message)
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
