// RevenueCat webhook -> duty_families premium columns (Apple in-app purchases).
//
// The Stripe webhook (../stripe-webhook) does the same job for web purchases. Both
// write the SAME columns, and both are the only writers: premium columns are
// service-role-only via the duty_families_guard_premium trigger, so the client can
// never grant itself premium. Keep that property.
//
// RevenueCat's app_user_id IS the duty_families.id — set in lib/revenuecat.ts when
// configuring the SDK. That is deliberate: premium is a family-level fact, so either
// parent's purchase covers the family and restores on a second parent's device.
//
// Secrets (Supabase project-wide namespace, so DUTY_-prefixed by convention):
//   DUTY_REVENUECAT_WEBHOOK_SECRET  - the Authorization header value set in the
//                                     RevenueCat dashboard webhook config.
// verify_jwt must be FALSE for this function: RevenueCat sends no Supabase JWT.

import { createClient } from 'jsr:@supabase/supabase-js@2'

const WEBHOOK_SECRET = Deno.env.get('DUTY_REVENUECAT_WEBHOOK_SECRET') ?? ''
const PREMIUM_ENTITLEMENT = 'premium'

// Events that mean "this family should have premium right now".
const GRANTING = new Set([
  'INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION',
  'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED', 'TEMPORARY_ENTITLEMENT_GRANT',
])
// Events that revoke access immediately.
const REVOKING = new Set(['EXPIRATION', 'REFUND', 'SUBSCRIPTION_PAUSED'])
// CANCELLATION means auto-renew was turned off; access continues to period end,
// so it is deliberately NOT revoking. BILLING_ISSUE is handled as past_due below.

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  // RevenueCat authenticates with a static Authorization header, not a signature.
  // Compare in constant time so the secret can't be probed by timing.
  const provided = req.headers.get('authorization') ?? ''
  if (!WEBHOOK_SECRET || !timingSafeEqual(provided, WEBHOOK_SECRET)) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: { event?: Record<string, unknown> }
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad JSON', { status: 400 })
  }

  const event = payload.event
  if (!event) return new Response('No event', { status: 400 })

  const type = String(event.type ?? '')
  const familyId = String(event.app_user_id ?? '')
  const entitlements = (event.entitlement_ids as string[] | null) ?? []

  // Anonymous ids appear if the SDK ever runs before a family exists. Nothing to do.
  if (!familyId || familyId.startsWith('$RCAnonymousID:')) {
    return new Response(JSON.stringify({ ok: true, skipped: 'no family id' }), { status: 200 })
  }
  // Ignore events for other entitlements, if more are ever added.
  if (entitlements.length && !entitlements.includes(PREMIUM_ENTITLEMENT)) {
    return new Response(JSON.stringify({ ok: true, skipped: 'other entitlement' }), { status: 200 })
  }

  // event_timestamp_ms is when RevenueCat recorded it. Reused as stripe_event_at so
  // BOTH billing sources share one ordering clock on the row — otherwise a late
  // redelivery from one could clobber a newer state from the other.
  const eventAt = new Date(Number(event.event_timestamp_ms ?? Date.now())).toISOString()
  const expiresMs = Number(event.expiration_at_ms ?? 0)
  const periodEnd = expiresMs ? new Date(expiresMs).toISOString() : null

  let status: 'active' | 'past_due' | 'canceled' | null = null
  if (GRANTING.has(type)) status = 'active'
  else if (REVOKING.has(type)) status = 'canceled'
  else if (type === 'BILLING_ISSUE') status = 'past_due'
  else if (type === 'PRODUCT_CHANGE' || type === 'CANCELLATION') status = 'active'

  if (status === null) {
    // TRANSFER, SUBSCRIBER_ALIAS, TEST, etc. Acknowledge so RevenueCat stops retrying.
    return new Response(JSON.stringify({ ok: true, ignored: type }), { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const fields: Record<string, unknown> = { premium_status: status, stripe_event_at: eventAt }
  // Only write a period end when the event carries one; never null out a good value.
  if (periodEnd) fields.premium_period_end = periodEnd

  const { data, error } = await supabase
    .from('duty_families')
    .update(fields)
    .eq('id', familyId)
    // Same staleness guard the Stripe webhook uses: never apply an older event.
    .or(`stripe_event_at.is.null,stripe_event_at.lte.${eventAt}`)
    .select('id')

  if (error) {
    console.error('revenuecat-webhook update failed', familyId, type, error.message)
    // 500 so RevenueCat retries a genuine write failure.
    return new Response('Update failed', { status: 500 })
  }
  if (!data?.length) {
    console.warn('revenuecat-webhook no-op (unknown family or stale event)', familyId, type)
  }

  return new Response(JSON.stringify({ ok: true, type, status, family: familyId }), {
    status: 200, headers: { 'Content-Type': 'application/json' },
  })
})

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
