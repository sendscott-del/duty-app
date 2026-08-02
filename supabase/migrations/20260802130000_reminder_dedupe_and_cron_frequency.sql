-- Chore-reminder cadence rework: fire once per day (dedupe) + slow the cron.
--
-- Why: the `duty-chore-reminders` pg_cron job ran every minute
-- (`* * * * *`) and posted to the send-chore-reminders edge function, which
-- matched each family's reminder_time to the EXACT current minute. On the
-- shared Supabase project that every-minute run was a large share of
-- pg_cron's own cron.job_run_details write IO (a Disk IO Budget concern
-- surfaced 2026-07-22).
--
-- The edge function now fires once per day at or after the family's
-- reminder_time and records the date in last_reminded_on so it never
-- double-sends. That makes an every-minute cron unnecessary — the job is
-- slowed to every 5 minutes, cutting ~80% of its run-logging writes. A
-- reminder now lands within ~5 min of the set time instead of on the dot,
-- and a missed cron run self-heals to the next run instead of skipping the
-- day.

-- 1) Per-family dedupe marker for "already reminded today".
alter table public.duty_families
  add column if not exists last_reminded_on date;

-- 2) Slow the pg_cron job from every minute to every 5 minutes.
--    Idempotent: only alters the job if it exists.
do $$
declare
  jid bigint;
begin
  select jobid into jid from cron.job where jobname = 'duty-chore-reminders';
  if jid is not null then
    perform cron.alter_job(jid, schedule => '*/5 * * * *');
  end if;
end $$;
