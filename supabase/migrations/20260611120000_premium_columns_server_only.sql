-- Make the premium / Stripe columns on duty_families SERVER-TRUTH.
--
-- Before this, the RLS policy `duty_families_parent_update` let a parent update
-- any column of their own family row, and no column-level grant restricted the
-- premium columns. A parent could therefore self-grant Premium for free with a
-- single client-side update (premium_status='active'). isPremium reads that
-- column, so the paywall was trivially bypassable.
--
-- Rather than revoke the table UPDATE grant and re-enumerate every editable
-- column (name, amazon_tag, reminders_enabled, reminder_time, ...) — which is
-- fragile — we use a BEFORE UPDATE trigger that protects ONLY the four
-- server-managed columns. The webhook / checkout functions use the service_role
-- key (current_user = 'service_role'), so they are unaffected; only the client
-- roles ('authenticated', 'anon') are restricted.

create or replace function public.duty_families_guard_premium()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if new.premium_status        is distinct from old.premium_status
    or new.premium_period_end    is distinct from old.premium_period_end
    or new.stripe_customer_id    is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
      raise exception
        'duty_families premium/stripe columns are server-managed and cannot be set by clients';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists duty_families_guard_premium on public.duty_families;

create trigger duty_families_guard_premium
  before update on public.duty_families
  for each row
  execute function public.duty_families_guard_premium();
