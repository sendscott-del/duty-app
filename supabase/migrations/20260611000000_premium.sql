-- Duty premium subscription fields.
-- premium_status: 'free' | 'active' | 'past_due' | 'canceled'
-- premium_period_end: when the paid period ends (null = never set)
-- stripe_customer_id / stripe_subscription_id: set by the stripe-webhook edge fn

alter table public.duty_families
  add column if not exists premium_status text not null default 'free'
    check (premium_status in ('free', 'active', 'past_due', 'canceled')),
  add column if not exists premium_period_end timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;
