-- Per-kid "all or nothing" chore payout.
--
-- Problem: a kid can cherry-pick the easy chores and still bank points, so the
-- hard ones never get done. When all_or_nothing is on for a kid, none of a
-- day's chore points are awarded until every chore assigned to them that day is
-- approved -- then the whole day lands at once, plus an optional completion
-- bonus.
--
-- Both columns live on duty_profiles (per-kid, not family-wide) so one kid can
-- be on the strict scheme while their siblings stay on per-chore payout.

alter table public.duty_profiles
  add column if not exists all_or_nothing boolean not null default false,
  add column if not exists completion_bonus integer not null default 0;

alter table public.duty_profiles
  drop constraint if exists duty_profiles_completion_bonus_nonneg;
alter table public.duty_profiles
  add constraint duty_profiles_completion_bonus_nonneg check (completion_bonus >= 0);

-- Kids are real authenticated users, and duty_profiles_update lets a row be
-- updated by `id = auth.uid()`. Without this guard a kid could simply switch
-- their own all_or_nothing off, or inflate their own completion_bonus. Same
-- belt-and-braces approach as duty_families_guard_premium: RLS decides who may
-- touch the row, this trigger decides who may touch these columns.
create or replace function public.duty_profiles_guard_payout_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if (new.all_or_nothing is distinct from false
          or new.completion_bonus is distinct from 0)
         and new.family_id is distinct from (select public.duty_my_parent_family_id()) then
        raise exception
          'duty_profiles payout rules may only be set by a parent of that family';
      end if;
    else
      if (new.all_or_nothing is distinct from old.all_or_nothing
          or new.completion_bonus is distinct from old.completion_bonus)
         and new.family_id is distinct from (select public.duty_my_parent_family_id()) then
        raise exception
          'duty_profiles payout rules may only be changed by a parent of that family';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists duty_profiles_guard_payout_rules on public.duty_profiles;
create trigger duty_profiles_guard_payout_rules
  before insert or update on public.duty_profiles
  for each row
  execute function public.duty_profiles_guard_payout_rules();

-- The completion bonus is one transaction per kid per day. award_date carries
-- the chore day it belongs to (the row's own created_at is when it was
-- approved, which can be the next morning).
alter table public.duty_point_transactions
  add column if not exists award_date date;

-- 'day_bonus' is distinct from 'bonus' so the all-done bonus can be found and
-- reversed without touching reward refunds, which also use 'bonus'.
alter table public.duty_point_transactions
  drop constraint if exists duty_point_transactions_reference_type_check;
alter table public.duty_point_transactions
  add constraint duty_point_transactions_reference_type_check
  check (reference_type in ('chore', 'redemption', 'bonus', 'penalty', 'day_bonus'));

-- Awarding is evaluated on every approval, so the same complete day can be
-- evaluated more than once. Chore points are already deduped by
-- duty_ptx_unique_chore_ref (reference_id, reference_type); this does the same
-- for the once-per-day bonus.
create unique index if not exists duty_ptx_unique_day_bonus
  on public.duty_point_transactions (profile_id, award_date)
  where reference_type = 'day_bonus';
