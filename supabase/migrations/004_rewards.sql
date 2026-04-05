create table duty_rewards (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references duty_families(id) on delete cascade,
  name text not null,
  emoji text not null default '🎁',
  points_cost integer not null,
  reward_type text check (reward_type in ('experience','privilege','item','amazon')) default 'experience',
  amazon_asin text,
  amazon_url text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table duty_redemptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references duty_families(id) on delete cascade,
  reward_id uuid references duty_rewards(id),
  redeemed_by uuid references duty_profiles(id),
  points_spent integer not null,
  status text check (status in ('pending','approved','rejected','fulfilled')) default 'pending',
  parent_note text,
  created_at timestamptz default now()
);

alter table duty_rewards enable row level security;
alter table duty_redemptions enable row level security;
