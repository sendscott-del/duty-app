create table duty_challenges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references duty_families(id) on delete cascade,
  title text not null,
  description text not null,
  goal_type text not null check (goal_type in ('family_completions', 'all_streaks', 'no_misses')),
  goal_value integer not null,
  bonus_points integer not null default 10,
  week_start date not null,
  week_end date not null,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table duty_challenges enable row level security;
create policy "challenges_select" on duty_challenges for select using (true);
create policy "challenges_insert" on duty_challenges for insert with check (true);
create policy "challenges_update" on duty_challenges for update using (true);
create policy "challenges_delete" on duty_challenges for delete using (true);
