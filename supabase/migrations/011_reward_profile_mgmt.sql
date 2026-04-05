-- Allow parents to update and soft-delete rewards
create policy "rewards_update" on duty_rewards for update
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));

-- Allow parents to update any profile in their family (edit kid)
drop policy if exists "profiles_update_own" on duty_profiles;
create policy "profiles_update" on duty_profiles for update
  using (
    id = auth.uid()
    or family_id in (select family_id from duty_profiles where id = auth.uid())
  );

-- Allow parents to delete kid profiles
create policy "profiles_delete" on duty_profiles for delete
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));
