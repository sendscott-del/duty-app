-- Track late completions and first-time completion for "NEW" badge
alter table duty_chores add column completed_late boolean default false;
alter table duty_chores add column first_completed_at timestamptz;
