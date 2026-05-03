-- Fix infinite recursion in duty_profiles_parent_select introduced in 018.
-- The self-referencing subquery `family_id in (select family_id from
-- duty_profiles where id = auth.uid())` triggered RLS on the inner query,
-- which re-evaluated the same policy. Replace with a SECURITY DEFINER
-- helper that bypasses RLS to fetch the caller's family_id.

create or replace function public.duty_my_family_id()
returns uuid
language sql stable security definer
set search_path = public, pg_temp
as $$
  select family_id from public.duty_profiles where id = auth.uid()
$$;

revoke all on function public.duty_my_family_id() from public;
grant execute on function public.duty_my_family_id() to authenticated;

drop policy if exists duty_profiles_parent_select on public.duty_profiles;

create policy duty_profiles_parent_select on public.duty_profiles
  for select to authenticated
  using (
    id = auth.uid()
    or family_id = public.duty_my_family_id()
  );
