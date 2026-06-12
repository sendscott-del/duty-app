-- Close the INSERT-side paywall bypass and add webhook event-ordering.
--
-- 1) INSERT GUARD
--    The previous guard trigger only fired BEFORE UPDATE. But the
--    `duty_families_parent_insert` RLS policy lets any authenticated parent
--    INSERT a family row, and its CHECK only verifies role='parent' — it does
--    NOT constrain the premium columns. So a parent could:
--      a. INSERT a new duty_families row with premium_status='active', then
--      b. UPDATE their own duty_profiles.family_id to point at it
--         (allowed by duty_profiles_update where id = auth.uid()),
--    and usePremium would then read 'active' → free Premium. This is the same
--    bypass the UPDATE guard closed, just via INSERT. We extend the guard to
--    fire on INSERT too: client roles must create families on the free tier
--    with no Stripe values; only the payment system (service_role) may seed them.
--
-- 2) EVENT ORDERING
--    Add stripe_event_at so the webhook can ignore stale/out-of-order Stripe
--    redeliveries (e.g. a late subscription.updated:active arriving after
--    subscription.deleted, which would otherwise resurrect Premium).

create or replace function public.duty_families_guard_premium()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      -- New client-created families must start on the free tier.
      if new.premium_status        is distinct from 'free'
      or new.premium_period_end    is not null
      or new.stripe_customer_id    is not null
      or new.stripe_subscription_id is not null
      or new.stripe_event_at       is not null then
        raise exception
          'duty_families premium/stripe columns are server-managed and cannot be set by clients';
      end if;
    else  -- UPDATE
      if new.premium_status        is distinct from old.premium_status
      or new.premium_period_end    is distinct from old.premium_period_end
      or new.stripe_customer_id    is distinct from old.stripe_customer_id
      or new.stripe_subscription_id is distinct from old.stripe_subscription_id
      or new.stripe_event_at       is distinct from old.stripe_event_at then
        raise exception
          'duty_families premium/stripe columns are server-managed and cannot be set by clients';
      end if;
    end if;
  end if;
  return new;
end;
$$;

alter table public.duty_families
  add column if not exists stripe_event_at timestamptz;

drop trigger if exists duty_families_guard_premium on public.duty_families;

create trigger duty_families_guard_premium
  before insert or update on public.duty_families
  for each row
  execute function public.duty_families_guard_premium();
