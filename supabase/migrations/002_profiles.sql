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

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.duty_profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), 'parent');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
