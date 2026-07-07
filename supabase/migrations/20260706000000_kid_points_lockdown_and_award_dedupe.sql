-- Close two economy holes and one double-award bug.
--
-- Background: since the kid-auth lockdown, kids are real authenticated users.
-- The broad family-scoped write policies added there were correct for SELECT
-- (kids must read their family's data) but too broad for writes:
--   * duty_family_insert_points let a kid INSERT a positive-amount transaction
--     and self-grant unlimited points.
--   * duty_family_delete_points let a kid DELETE transactions (e.g. delete their
--     own negative "spend" row to refund themselves).
-- Kids DO legitimately insert *negative* point transactions when they spend on
-- a reward (KidShop), so the fix is not "parent-only" -- it's "kids may spend,
-- not mint."

-- 1) Non-parents may only insert non-positive (spending) transactions. Parents
--    keep unrestricted insert via duty_points_parent_insert (positive awards,
--    manual adjustments). duty_my_parent_family_id() returns NULL for kids, so
--    the parent policy never matches a kid.
drop policy if exists duty_family_insert_points on public.duty_point_transactions;
create policy duty_family_insert_points on public.duty_point_transactions
  for insert to authenticated
  with check (
    family_id in (select public.duty_my_family_ids())
    and amount <= 0
  );

-- 2) Remove the kid-accessible DELETE. Parents retain delete (undo/unapprove)
--    via duty_points_parent_delete.
drop policy if exists duty_family_delete_points on public.duty_point_transactions;

-- 3) Kids insert their own redemption requests, but must not be able to mark one
--    approved/fulfilled themselves -- pin non-parent inserts to 'pending'.
--    Parents are unaffected (they insert via duty_redemptions_parent_insert,
--    which has no status constraint).
drop policy if exists duty_family_insert_redemptions on public.duty_redemptions;
create policy duty_family_insert_redemptions on public.duty_redemptions
  for insert to authenticated
  with check (
    family_id in (select public.duty_my_family_ids())
    and status = 'pending'
  );

-- 4) Prevent double-award of chore points. A completion backs exactly one 'chore'
--    transaction. Partial (chore-only) so repeat reward redemptions -- which reuse
--    reward_id as reference_id with reference_type 'redemption' -- still work.
create unique index if not exists duty_ptx_unique_chore_ref
  on public.duty_point_transactions (reference_id, reference_type)
  where reference_type = 'chore';
