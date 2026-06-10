-- Duty v2: lock down world-readable family data + real (invisible) kid auth.
--
-- Before: every duty_* table had anon SELECT (qual true) — anyone holding the
-- public anon key could read EVERY family's kids, points, chores, and PINs —
-- plus anon INSERT/UPDATE/DELETE on completions, point transactions,
-- redemptions, and push subscriptions. The kid flow ran unauthenticated and
-- compared PINs client-side.
--
-- After: kids sign in through the duty-kid-login edge function (server-side
-- PIN check + invisible auth user per kid). All anon policies are dropped;
-- family-scoped authenticated policies cover both parents (profile id =
-- auth.uid()) and kids (profile auth_user_id = auth.uid()).

-- 1. Kid auth mapping
alter table public.duty_profiles
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

-- 2. Family helper covering parents AND kids
create or replace function public.duty_my_family_ids()
returns setof uuid language sql stable security definer set search_path to ''
as $$
  select family_id from public.duty_profiles
   where (id = auth.uid() or auth_user_id = auth.uid()) and family_id is not null;
$$;

-- 3. PIN attempt rate-limit log (service-role only)
create table if not exists public.duty_kid_login_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null,
  success boolean not null default false,
  attempted_at timestamptz not null default now()
);
alter table public.duty_kid_login_attempts enable row level security;
-- no policies: only service role can touch it

-- 4. Drop every anon policy
drop policy if exists "duty_challenges_anon_select" on public.duty_challenges;
drop policy if exists "duty_completions_anon_select" on public.duty_chore_completions;
drop policy if exists "duty_completions_anon_insert" on public.duty_chore_completions;
drop policy if exists "duty_completions_anon_update" on public.duty_chore_completions;
drop policy if exists "duty_completions_anon_delete" on public.duty_chore_completions;
drop policy if exists "duty_chores_anon_select" on public.duty_chores;
drop policy if exists "duty_families_anon_select" on public.duty_families;
drop policy if exists "duty_points_anon_select" on public.duty_point_transactions;
drop policy if exists "duty_points_anon_insert_redemption" on public.duty_point_transactions;
drop policy if exists "duty_points_anon_delete_unapproved" on public.duty_point_transactions;
drop policy if exists "duty_profiles_anon_select" on public.duty_profiles;
drop policy if exists "duty_redemptions_anon_select" on public.duty_redemptions;
drop policy if exists "duty_redemptions_anon_insert" on public.duty_redemptions;
drop policy if exists "duty_rewards_anon_select" on public.duty_rewards;
drop policy if exists "duty_push_subs_anon_insert" on public.duty_push_subscriptions;
drop policy if exists "duty_push_subs_anon_update" on public.duty_push_subscriptions;
drop policy if exists "duty_push_subs_anon_delete" on public.duty_push_subscriptions;

-- 5. Family-member (parent OR kid) policies. These OR with the existing
--    parent-only policies, extending the same scope to authenticated kids.
drop policy if exists duty_family_select_families on public.duty_families;
create policy duty_family_select_families on public.duty_families
  for select to authenticated using (id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_select_profiles on public.duty_profiles;
create policy duty_family_select_profiles on public.duty_profiles
  for select to authenticated using (
    id = auth.uid() or auth_user_id = auth.uid()
    or family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_select_chores on public.duty_chores;
create policy duty_family_select_chores on public.duty_chores
  for select to authenticated using (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_select_challenges on public.duty_challenges;
create policy duty_family_select_challenges on public.duty_challenges
  for select to authenticated using (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_select_rewards on public.duty_rewards;
create policy duty_family_select_rewards on public.duty_rewards
  for select to authenticated using (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_select_completions on public.duty_chore_completions;
create policy duty_family_select_completions on public.duty_chore_completions
  for select to authenticated using (
    chore_id in (select id from public.duty_chores
                  where family_id in (select public.duty_my_family_ids())));

drop policy if exists duty_family_write_completions on public.duty_chore_completions;
create policy duty_family_write_completions on public.duty_chore_completions
  for all to authenticated using (
    chore_id in (select id from public.duty_chores
                  where family_id in (select public.duty_my_family_ids())))
  with check (
    chore_id in (select id from public.duty_chores
                  where family_id in (select public.duty_my_family_ids())));

drop policy if exists duty_family_select_points on public.duty_point_transactions;
create policy duty_family_select_points on public.duty_point_transactions
  for select to authenticated using (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_insert_points on public.duty_point_transactions;
create policy duty_family_insert_points on public.duty_point_transactions
  for insert to authenticated with check (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_delete_points on public.duty_point_transactions;
create policy duty_family_delete_points on public.duty_point_transactions
  for delete to authenticated using (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_select_redemptions on public.duty_redemptions;
create policy duty_family_select_redemptions on public.duty_redemptions
  for select to authenticated using (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_insert_redemptions on public.duty_redemptions;
create policy duty_family_insert_redemptions on public.duty_redemptions
  for insert to authenticated with check (family_id in (select public.duty_my_family_ids()));

drop policy if exists duty_family_write_push_subs on public.duty_push_subscriptions;
create policy duty_family_write_push_subs on public.duty_push_subscriptions
  for all to authenticated using (family_id in (select public.duty_my_family_ids()))
  with check (family_id in (select public.duty_my_family_ids()));
