create table duty_profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  role text check (role in ('parent','kid')) not null,
  family_id uuid references duty_families(id) on delete cascade,
  avatar_color text default 'purple',
  pin text,
  created_at timestamptz default now()
);
alter table duty_profiles enable row level security;

-- No trigger — profile is created manually on signup to avoid
-- conflicts with Magnify's on_auth_user_created trigger.
