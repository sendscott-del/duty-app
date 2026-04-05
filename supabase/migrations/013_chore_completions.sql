-- Per-day chore completion tracking
-- The chore row is a template (recurring). Completions are per-date.
create table duty_chore_completions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid references duty_chores(id) on delete cascade,
  completed_by uuid references duty_profiles(id),
  completion_date date not null,
  status text check (status in ('submitted','approved','rejected')) default 'submitted',
  completed_late boolean default false,
  approved_at timestamptz,
  approved_by uuid references duty_profiles(id),
  proof_image_url text,
  created_at timestamptz default now(),
  unique(chore_id, completion_date)
);

alter table duty_chore_completions enable row level security;

-- Everyone can read/write completions (kids have no auth session)
create policy "completions_select" on duty_chore_completions for select using (true);
create policy "completions_insert" on duty_chore_completions for insert with check (true);
create policy "completions_update" on duty_chore_completions for update using (true);
create policy "completions_delete" on duty_chore_completions for delete using (true);

-- Realtime
alter publication supabase_realtime add table duty_chore_completions;
