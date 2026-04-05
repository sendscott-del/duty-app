create table duty_families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amazon_tag text,
  created_at timestamptz default now()
);
alter table duty_families enable row level security;
