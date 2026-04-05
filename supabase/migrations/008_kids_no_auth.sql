-- Allow kid profiles without auth accounts
-- Drop the FK to auth.users so we can insert profile-only kid records
alter table duty_profiles drop constraint duty_profiles_pkey;
alter table duty_profiles drop constraint if exists duty_profiles_id_fkey;
alter table duty_profiles add primary key (id);

-- Allow insert by any authenticated user (parent adding kids)
drop policy if exists "profiles_insert" on duty_profiles;
create policy "profiles_insert" on duty_profiles for insert
  with check (true);
