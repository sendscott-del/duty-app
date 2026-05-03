-- Performance optimization: replace per-row duty_is_family_parent(family_id)
-- calls with per-statement (select duty_my_parent_family_id()) lookups.
-- Postgres caches the (select ...) result for the whole statement instead
-- of re-running the function for every row.

create or replace function public.duty_my_parent_family_id()
returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select family_id from public.duty_profiles
  where id = auth.uid() and role = 'parent'
$$;

revoke all on function public.duty_my_parent_family_id() from public;
grant execute on function public.duty_my_parent_family_id() to authenticated;

-- duty_families
drop policy if exists duty_families_parent_select on public.duty_families;
drop policy if exists duty_families_parent_update on public.duty_families;
drop policy if exists duty_families_parent_delete on public.duty_families;

create policy duty_families_parent_select on public.duty_families
  for select to authenticated
  using (id = (select public.duty_my_parent_family_id()));

create policy duty_families_parent_update on public.duty_families
  for update to authenticated
  using (id = (select public.duty_my_parent_family_id()))
  with check (id = (select public.duty_my_parent_family_id()));

create policy duty_families_parent_delete on public.duty_families
  for delete to authenticated
  using (id = (select public.duty_my_parent_family_id()));

-- duty_profiles
drop policy if exists duty_profiles_parent_select on public.duty_profiles;
drop policy if exists duty_profiles_insert_kid on public.duty_profiles;
drop policy if exists duty_profiles_update on public.duty_profiles;
drop policy if exists duty_profiles_delete on public.duty_profiles;

create policy duty_profiles_parent_select on public.duty_profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or family_id = (select public.duty_my_parent_family_id())
  );

create policy duty_profiles_insert_kid on public.duty_profiles
  for insert to authenticated
  with check (
    role = 'kid'
    and family_id = (select public.duty_my_parent_family_id())
  );

create policy duty_profiles_update on public.duty_profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or family_id = (select public.duty_my_parent_family_id())
  )
  with check (
    id = (select auth.uid())
    or family_id = (select public.duty_my_parent_family_id())
  );

create policy duty_profiles_delete on public.duty_profiles
  for delete to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));

-- duty_chores
drop policy if exists duty_chores_parent_select on public.duty_chores;
drop policy if exists duty_chores_parent_insert on public.duty_chores;
drop policy if exists duty_chores_parent_update on public.duty_chores;
drop policy if exists duty_chores_parent_delete on public.duty_chores;

create policy duty_chores_parent_select on public.duty_chores
  for select to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));
create policy duty_chores_parent_insert on public.duty_chores
  for insert to authenticated
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_chores_parent_update on public.duty_chores
  for update to authenticated
  using (family_id = (select public.duty_my_parent_family_id()))
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_chores_parent_delete on public.duty_chores
  for delete to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));

-- duty_chore_completions
drop policy if exists duty_completions_parent_select on public.duty_chore_completions;
drop policy if exists duty_completions_parent_insert on public.duty_chore_completions;
drop policy if exists duty_completions_parent_update on public.duty_chore_completions;
drop policy if exists duty_completions_parent_delete on public.duty_chore_completions;

create policy duty_completions_parent_select on public.duty_chore_completions
  for select to authenticated
  using (chore_id in (
    select id from public.duty_chores
    where family_id = (select public.duty_my_parent_family_id())
  ));
create policy duty_completions_parent_insert on public.duty_chore_completions
  for insert to authenticated
  with check (chore_id in (
    select id from public.duty_chores
    where family_id = (select public.duty_my_parent_family_id())
  ));
create policy duty_completions_parent_update on public.duty_chore_completions
  for update to authenticated
  using (chore_id in (
    select id from public.duty_chores
    where family_id = (select public.duty_my_parent_family_id())
  ))
  with check (chore_id in (
    select id from public.duty_chores
    where family_id = (select public.duty_my_parent_family_id())
  ));
create policy duty_completions_parent_delete on public.duty_chore_completions
  for delete to authenticated
  using (chore_id in (
    select id from public.duty_chores
    where family_id = (select public.duty_my_parent_family_id())
  ));

-- duty_point_transactions
drop policy if exists duty_points_parent_select on public.duty_point_transactions;
drop policy if exists duty_points_parent_insert on public.duty_point_transactions;
drop policy if exists duty_points_parent_update on public.duty_point_transactions;
drop policy if exists duty_points_parent_delete on public.duty_point_transactions;

create policy duty_points_parent_select on public.duty_point_transactions
  for select to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));
create policy duty_points_parent_insert on public.duty_point_transactions
  for insert to authenticated
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_points_parent_update on public.duty_point_transactions
  for update to authenticated
  using (family_id = (select public.duty_my_parent_family_id()))
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_points_parent_delete on public.duty_point_transactions
  for delete to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));

-- duty_rewards
drop policy if exists duty_rewards_parent_select on public.duty_rewards;
drop policy if exists duty_rewards_parent_insert on public.duty_rewards;
drop policy if exists duty_rewards_parent_update on public.duty_rewards;
drop policy if exists duty_rewards_parent_delete on public.duty_rewards;

create policy duty_rewards_parent_select on public.duty_rewards
  for select to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));
create policy duty_rewards_parent_insert on public.duty_rewards
  for insert to authenticated
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_rewards_parent_update on public.duty_rewards
  for update to authenticated
  using (family_id = (select public.duty_my_parent_family_id()))
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_rewards_parent_delete on public.duty_rewards
  for delete to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));

-- duty_redemptions
drop policy if exists duty_redemptions_parent_select on public.duty_redemptions;
drop policy if exists duty_redemptions_parent_insert on public.duty_redemptions;
drop policy if exists duty_redemptions_parent_update on public.duty_redemptions;
drop policy if exists duty_redemptions_parent_delete on public.duty_redemptions;

create policy duty_redemptions_parent_select on public.duty_redemptions
  for select to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));
create policy duty_redemptions_parent_insert on public.duty_redemptions
  for insert to authenticated
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_redemptions_parent_update on public.duty_redemptions
  for update to authenticated
  using (family_id = (select public.duty_my_parent_family_id()))
  with check (family_id = (select public.duty_my_parent_family_id()));
create policy duty_redemptions_parent_delete on public.duty_redemptions
  for delete to authenticated
  using (family_id = (select public.duty_my_parent_family_id()));

-- duty_challenges
drop policy if exists duty_challenges_parent_all on public.duty_challenges;

create policy duty_challenges_parent_all on public.duty_challenges
  for all to authenticated
  using (family_id = (select public.duty_my_parent_family_id()))
  with check (family_id = (select public.duty_my_parent_family_id()));

-- Storage: chore-photos and chore-proofs
drop policy if exists duty_chore_storage_parent_select on storage.objects;
drop policy if exists duty_chore_storage_parent_insert on storage.objects;
drop policy if exists duty_chore_storage_parent_update on storage.objects;
drop policy if exists duty_chore_storage_parent_delete on storage.objects;

create policy duty_chore_storage_parent_select on storage.objects
  for select to authenticated
  using (
    bucket_id in ('chore-photos', 'chore-proofs')
    and (storage.foldername(name))[1] = (select public.duty_my_parent_family_id())::text
  );

create policy duty_chore_storage_parent_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('chore-photos', 'chore-proofs')
    and (storage.foldername(name))[1] = (select public.duty_my_parent_family_id())::text
  );

create policy duty_chore_storage_parent_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('chore-photos', 'chore-proofs')
    and (storage.foldername(name))[1] = (select public.duty_my_parent_family_id())::text
  )
  with check (
    bucket_id in ('chore-photos', 'chore-proofs')
    and (storage.foldername(name))[1] = (select public.duty_my_parent_family_id())::text
  );

create policy duty_chore_storage_parent_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('chore-photos', 'chore-proofs')
    and (storage.foldername(name))[1] = (select public.duty_my_parent_family_id())::text
  );
