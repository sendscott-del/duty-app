-- Allow anon (kid) users to read and update chores, and insert point transactions
-- Kids don't have auth sessions, so they use the anon role.

-- Chores: anon can update status (kid completing a chore)
create policy "chores_update_anon" on duty_chores for update
  using (true)
  with check (true);

-- Point transactions: anon can insert (kid earning/spending points)
create policy "points_insert_anon" on duty_point_transactions for insert
  with check (true);

-- Redemptions: anon can insert (kid redeeming rewards)
drop policy if exists "redemptions_insert" on duty_redemptions;
create policy "redemptions_insert" on duty_redemptions for insert
  with check (true);

-- Chores: anon can read (kid viewing their chores)
-- Already covered by profiles_read using(true) but chores_read requires auth.uid()
create policy "chores_read_anon" on duty_chores for select
  using (true);

-- Rewards: anon can read (kid viewing reward shop)
create policy "rewards_read_anon" on duty_rewards for select
  using (true);

-- Redemptions: anon can read
create policy "redemptions_read_anon" on duty_redemptions for select
  using (true);

-- Point transactions: anon can read (kid viewing balance)
create policy "points_read_anon" on duty_point_transactions for select
  using (true);

-- Families: anon can read (kid login loads family)
create policy "family_read_anon" on duty_families for select
  using (true);
