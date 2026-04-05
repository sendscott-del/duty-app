create table duty_chores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references duty_families(id) on delete cascade,
  assigned_to uuid references duty_profiles(id) on delete cascade,
  assigned_by uuid references duty_profiles(id),
  name text not null,
  emoji text not null default '✅',
  points integer not null default 10,
  status text check (status in ('pending','submitted','approved','rejected')) default 'pending',
  requires_proof boolean default false,
  proof_image_url text,
  proof_submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references duty_profiles(id),
  rejection_note text,
  due_date date,
  recurrence text check (recurrence in ('none','daily','weekly')) default 'none',
  created_at timestamptz default now()
);
alter table duty_chores enable row level security;
