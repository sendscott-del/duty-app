create table duty_point_transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references duty_families(id) on delete cascade,
  profile_id uuid references duty_profiles(id),
  amount integer not null,
  reason text not null,
  reference_id uuid,
  reference_type text check (reference_type in ('chore','redemption','bonus','penalty')),
  created_by uuid references duty_profiles(id),
  created_at timestamptz default now()
);
alter table duty_point_transactions enable row level security;
