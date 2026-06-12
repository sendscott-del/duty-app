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

function customerId(sub: Stripe.Subscription): string | null {
  return typeof sub.customer === 'string' ? sub.customer : sub.customer?.id ?? null
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

  // Event timestamp, used to ignore stale / out-of-order Stripe redeliveries.
  const eventAt = new Date(event.created * 1000).toISOString()

  // Apply a premium-column write only when:
  //  - the family exists AND its stored stripe_customer_id matches this
  //    subscription's customer (defense-in-depth vs. metadata drift), and
  //  - this event is newer than the last one we applied (ordering / idempotency).
  async function applyPremium(sub: Stripe.Subscription, fields: Record<string, unknown>) {
    const familyId = sub.metadata?.duty_family_id
    if (!familyId) {
      console.error('subscription missing duty_family_id metadata', sub.id)
      return
    }
    const cust = customerId(sub)
    if (!cust) {
      console.error('subscription missing customer', sub.id)
      return
    }
    const { data, error } = await supabase
      .from('duty_families')
      .update({ ...fields, stripe_event_at: eventAt })
      .eq('id', familyId)
      .eq('stripe_customer_id', cust)
      .or(`stripe_event_at.is.null,stripe_event_at.lte.${eventAt}`)
      .select('id')
    if (error) console.error('applyPremium update failed', familyId, error.message)
    else if (!data?.length) {
      console.warn('applyPremium no-op (customer mismatch or stale event)', familyId, sub.id)
    }
  }

  function liveStatus(sub: Stripe.Subscription): 'active' | 'past_due' | 'canceled' {
    return sub.status === 'active' || sub.status === 'trialing' ? 'active'
      : sub.status === 'past_due' ? 'past_due'
      : 'canceled'
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      await applyPremium(sub, {
        premium_status: liveStatus(sub),
        premium_period_end: periodEndISO(sub),
        stripe_subscription_id: sub.id,
      })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await applyPremium(sub, {
        premium_status: 'canceled',
        premium_period_end: periodEndISO(sub),
      })
      break
    }
  }

  return new Response('ok')
})
