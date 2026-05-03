-- Lock down duty_* policies so anon (kids) get only the operations they
-- actually need, and authenticated users must have a parent profile in the
-- specific family. Replaces the wide-open _anon overrides.
--
-- Applied to production via Supabase MCP on 2026-05-02.

-- =============================================================================
-- Helper function: is the calling user a parent in this family?
-- =============================================================================
create or replace function public.duty_is_family_parent(p_family_id uuid)
returns boolean
language sql
stable security definer
set search_path = public, pg_temp
as $$
  select exists(
    select 1 from public.duty_profiles
    where id = auth.uid()
      and family_id = p_family_id
      and role = 'parent'
  );
$$;

revoke all on function public.duty_is_family_parent(uuid) from public;
grant execute on function public.duty_is_family_parent(uuid) to authenticated;

-- =============================================================================
-- duty_families
-- =============================================================================
drop policy if exists "family_all" on public.duty_families;
drop policy if exists "family_read_anon" on public.duty_families;

create policy duty_families_parent_select on public.duty_families
  for select to authenticated
  using (public.duty_is_family_parent(id));

create policy duty_families_parent_insert on public.duty_families
  for insert to authenticated
  with check (
    exists(select 1 from public.duty_profiles where id = auth.uid() and role = 'parent')
  );

create policy duty_families_parent_update on public.duty_families
  for update to authenticated
  using (public.duty_is_family_parent(id))
  with check (public.duty_is_family_parent(id));

create policy duty_families_parent_delete on public.duty_families
  for delete to authenticated
  using (public.duty_is_family_parent(id));

create policy duty_families_anon_select on public.duty_families
  for select to anon using (true);

-- =============================================================================
-- duty_profiles
-- =============================================================================
-- NOTE: PIN column is currently SELECT-able by anon because the kid login
-- flow reads it client-side. Future work: move PIN check to a SECURITY
-- DEFINER function so PINs aren't exposed.
drop policy if exists "profiles_insert" on public.duty_profiles;
drop policy if exists "profiles_read" on public.duty_profiles;
drop policy if exists "profiles_update" on public.duty_profiles;
drop policy if exists "profiles_delete" on public.duty_profiles;

create policy duty_profiles_parent_select on public.duty_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or family_id in (select family_id from public.duty_profiles where id = auth.uid())
  );

create policy duty_profiles_insert_self on public.duty_profiles
  for insert to authenticated
  with check (id = auth.uid());

create policy duty_profiles_insert_kid on public.duty_profiles
  for insert to authenticated
  with check (
    role = 'kid'
    and public.duty_is_family_parent(family_id)
  );

create policy duty_profiles_update on public.duty_profiles
  for update to authenticated
  using (id = auth.uid() or public.duty_is_family_parent(family_id))
  with check (id = auth.uid() or public.duty_is_family_parent(family_id));

create policy duty_profiles_delete on public.duty_profiles
  for delete to authenticated
  using (public.duty_is_family_parent(family_id));

create policy duty_profiles_anon_select on public.duty_profiles
  for select to anon using (true);

-- =============================================================================
-- duty_chores
-- =============================================================================
drop policy if exists "chores_read" on public.duty_chores;
drop policy if exists "chores_read_anon" on public.duty_chores;
drop policy if exists "chores_insert" on public.duty_chores;
drop policy if exists "chores_update" on public.duty_chores;
drop policy if exists "chores_update_anon" on public.duty_chores;
drop policy if exists "chores_delete" on public.duty_chores;

create policy duty_chores_parent_select on public.duty_chores
  for select to authenticated using (public.duty_is_family_parent(family_id));
create policy duty_chores_parent_insert on public.duty_chores
  for insert to authenticated with check (public.duty_is_family_parent(family_id));
create policy duty_chores_parent_update on public.duty_chores
  for update to authenticated
  using (public.duty_is_family_parent(family_id))
  with check (public.duty_is_family_parent(family_id));
create policy duty_chores_parent_delete on public.duty_chores
  for delete to authenticated using (public.duty_is_family_parent(family_id));

create policy duty_chores_anon_select on public.duty_chores
  for select to anon using (true);

-- =============================================================================
-- duty_chore_completions
-- =============================================================================
drop policy if exists "completions_select" on public.duty_chore_completions;
drop policy if exists "completions_insert" on public.duty_chore_completions;
drop policy if exists "completions_update" on public.duty_chore_completions;
drop policy if exists "completions_delete" on public.duty_chore_completions;

create policy duty_completions_parent_select on public.duty_chore_completions
  for select to authenticated
  using (chore_id in (
    select id from public.duty_chores where public.duty_is_family_parent(family_id)
  ));
create policy duty_completions_parent_insert on public.duty_chore_completions
  for insert to authenticated
  with check (chore_id in (
    select id from public.duty_chores where public.duty_is_family_parent(family_id)
  ));
create policy duty_completions_parent_update on public.duty_chore_completions
  for update to authenticated
  using (chore_id in (
    select id from public.duty_chores where public.duty_is_family_parent(family_id)
  ))
  with check (chore_id in (
    select id from public.duty_chores where public.duty_is_family_parent(family_id)
  ));
create policy duty_completions_parent_delete on public.duty_chore_completions
  for delete to authenticated
  using (chore_id in (
    select id from public.duty_chores where public.duty_is_family_parent(family_id)
  ));

create policy duty_completions_anon_select on public.duty_chore_completions
  for select to anon using (true);
create policy duty_completions_anon_insert on public.duty_chore_completions
  for insert to anon
  with check (status = 'submitted' and approved_by is null);
create policy duty_completions_anon_update on public.duty_chore_completions
  for update to anon
  using (status = 'submitted')
  with check (status = 'submitted' and approved_by is null);
create policy duty_completions_anon_delete on public.duty_chore_completions
  for delete to anon
  using (status = 'submitted');

-- =============================================================================
-- duty_point_transactions
-- =============================================================================
drop policy if exists "points_read" on public.duty_point_transactions;
drop policy if exists "points_read_anon" on public.duty_point_transactions;
drop policy if exists "points_insert" on public.duty_point_transactions;
drop policy if exists "points_insert_anon" on public.duty_point_transactions;
drop policy if exists "points_delete" on public.duty_point_transactions;

create policy duty_points_parent_select on public.duty_point_transactions
  for select to authenticated using (public.duty_is_family_parent(family_id));
create policy duty_points_parent_insert on public.duty_point_transactions
  for insert to authenticated with check (public.duty_is_family_parent(family_id));
create policy duty_points_parent_update on public.duty_point_transactions
  for update to authenticated
  using (public.duty_is_family_parent(family_id))
  with check (public.duty_is_family_parent(family_id));
create policy duty_points_parent_delete on public.duty_point_transactions
  for delete to authenticated using (public.duty_is_family_parent(family_id));

create policy duty_points_anon_select on public.duty_point_transactions
  for select to anon using (true);

-- Anon kids: insert only negative point transactions tied to a redemption
-- (kid spending points). Cannot self-credit. Cannot positive-amount insert.
create policy duty_points_anon_insert_redemption on public.duty_point_transactions
  for insert to anon
  with check (reference_type = 'redemption' and amount < 0);

-- Anon kids: delete the auto-created chore points only when the linked
-- completion is still 'submitted' (i.e., parent has not approved it).
create policy duty_points_anon_delete_unapproved on public.duty_point_transactions
  for delete to anon
  using (
    reference_type = 'chore'
    and reference_id in (
      select id from public.duty_chore_completions where status = 'submitted'
    )
  );

-- =============================================================================
-- duty_rewards
-- =============================================================================
drop policy if exists "rewards_read" on public.duty_rewards;
drop policy if exists "rewards_read_anon" on public.duty_rewards;
drop policy if exists "rewards_write" on public.duty_rewards;
drop policy if exists "rewards_update" on public.duty_rewards;

create policy duty_rewards_parent_select on public.duty_rewards
  for select to authenticated using (public.duty_is_family_parent(family_id));
create policy duty_rewards_parent_insert on public.duty_rewards
  for insert to authenticated with check (public.duty_is_family_parent(family_id));
create policy duty_rewards_parent_update on public.duty_rewards
  for update to authenticated
  using (public.duty_is_family_parent(family_id))
  with check (public.duty_is_family_parent(family_id));
create policy duty_rewards_parent_delete on public.duty_rewards
  for delete to authenticated using (public.duty_is_family_parent(family_id));

create policy duty_rewards_anon_select on public.duty_rewards
  for select to anon using (true);

-- =============================================================================
-- duty_redemptions
-- =============================================================================
drop policy if exists "redemptions_read" on public.duty_redemptions;
drop policy if exists "redemptions_read_anon" on public.duty_redemptions;
drop policy if exists "redemptions_insert" on public.duty_redemptions;
drop policy if exists "redemptions_update" on public.duty_redemptions;

create policy duty_redemptions_parent_select on public.duty_redemptions
  for select to authenticated using (public.duty_is_family_parent(family_id));
create policy duty_redemptions_parent_insert on public.duty_redemptions
  for insert to authenticated with check (public.duty_is_family_parent(family_id));
create policy duty_redemptions_parent_update on public.duty_redemptions
  for update to authenticated
  using (public.duty_is_family_parent(family_id))
  with check (public.duty_is_family_parent(family_id));
create policy duty_redemptions_parent_delete on public.duty_redemptions
  for delete to authenticated using (public.duty_is_family_parent(family_id));

create policy duty_redemptions_anon_select on public.duty_redemptions
  for select to anon using (true);
create policy duty_redemptions_anon_insert on public.duty_redemptions
  for insert to anon
  with check (status = 'pending');

-- =============================================================================
-- duty_challenges
-- =============================================================================
drop policy if exists "challenges_select" on public.duty_challenges;
drop policy if exists "challenges_insert" on public.duty_challenges;
drop policy if exists "challenges_update" on public.duty_challenges;
drop policy if exists "challenges_delete" on public.duty_challenges;

create policy duty_challenges_parent_all on public.duty_challenges
  for all to authenticated
  using (public.duty_is_family_parent(family_id))
  with check (public.duty_is_family_parent(family_id));

create policy duty_challenges_anon_select on public.duty_challenges
  for select to anon using (true);

-- =============================================================================
-- Storage: chore-photos and chore-proofs (family-scoped, parents only)
-- Path convention: <family_id>/<rest>  (e.g. <family_id>/<kid_id>/<chore_id>.jpg)
-- =============================================================================
drop policy if exists parent_upload_avatar on storage.objects;
drop policy if exists parent_update_avatar on storage.objects;
drop policy if exists parent_delete_avatar on storage.objects;
drop policy if exists kid_upload_proof on storage.objects;
drop policy if exists family_view_proof on storage.objects;

update storage.buckets set public = false where id in ('chore-photos', 'chore-proofs');

create policy duty_chore_storage_parent_select on storage.objects
  for select to authenticated
  using (
    bucket_id in ('chore-photos', 'chore-proofs')
    and public.duty_is_family_parent(
      nullif((storage.foldername(name))[1], '')::uuid
    )
  );

create policy duty_chore_storage_parent_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('chore-photos', 'chore-proofs')
    and public.duty_is_family_parent(
      nullif((storage.foldername(name))[1], '')::uuid
    )
  );

create policy duty_chore_storage_parent_update on storage.objects
  for update to authenticated
  using (
    bucket_id in ('chore-photos', 'chore-proofs')
    and public.duty_is_family_parent(
      nullif((storage.foldername(name))[1], '')::uuid
    )
  )
  with check (
    bucket_id in ('chore-photos', 'chore-proofs')
    and public.duty_is_family_parent(
      nullif((storage.foldername(name))[1], '')::uuid
    )
  );

create policy duty_chore_storage_parent_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('chore-photos', 'chore-proofs')
    and public.duty_is_family_parent(
      nullif((storage.foldername(name))[1], '')::uuid
    )
  );
