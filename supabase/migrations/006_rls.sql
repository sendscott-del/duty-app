-- Families
create policy "family_read" on duty_families for select
  using (id in (select family_id from duty_profiles where id = auth.uid()));

create policy "family_insert" on duty_families for insert
  with check (auth.uid() is not null);

-- Profiles
create policy "profiles_read" on duty_profiles for select
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));
create policy "profiles_update_own" on duty_profiles for update using (id = auth.uid());
create policy "profiles_insert" on duty_profiles for insert with check (true);

-- Chores
create policy "chores_read" on duty_chores for select
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));
create policy "chores_insert" on duty_chores for insert
  with check (family_id in (select family_id from duty_profiles where id = auth.uid()));
create policy "chores_update" on duty_chores for update
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));

-- Rewards
create policy "rewards_read" on duty_rewards for select
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));
create policy "rewards_write" on duty_rewards for insert
  with check (family_id in (select family_id from duty_profiles where id = auth.uid()));
create policy "rewards_update" on duty_rewards for update
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));

-- Redemptions
create policy "redemptions_read" on duty_redemptions for select
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));
create policy "redemptions_insert" on duty_redemptions for insert
  with check (redeemed_by = auth.uid());
create policy "redemptions_update" on duty_redemptions for update
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));

-- Points
create policy "points_read" on duty_point_transactions for select
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));
create policy "points_insert" on duty_point_transactions for insert
  with check (family_id in (select family_id from duty_profiles where id = auth.uid()));
