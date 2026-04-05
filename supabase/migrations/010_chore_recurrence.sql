-- Add monthly recurrence and day-of-week selection
alter table duty_chores drop constraint if exists duty_chores_recurrence_check;
alter table duty_chores add constraint duty_chores_recurrence_check
  check (recurrence in ('none','daily','weekly','monthly'));

-- Days of week for weekly chores (0=Sun, 1=Mon, ... 6=Sat)
alter table duty_chores add column recurrence_days integer[];

-- Allow parents to delete chores
create policy "chores_delete" on duty_chores for delete
  using (family_id in (select family_id from duty_profiles where id = auth.uid()));
