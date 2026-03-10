-- Allow 'app' as an actor value (cron uses it for notifications)
alter table public.activity_log drop constraint activity_log_actor_check;
alter table public.activity_log add constraint activity_log_actor_check
  check (actor in ('user', 'ai', 'app'));

-- Immutable helper: timestamptz → date in UTC
-- (needed because DATE(timestamptz) is timezone-dependent and not immutable)
create or replace function public.to_utc_date(ts timestamptz)
returns date as $$
  select (ts at time zone 'UTC')::date;
$$ language sql immutable parallel safe;

-- Prevent duplicate checkin_sent notifications via a unique partial index.
-- Only one checkin_sent per user/type/day is allowed, making concurrent
-- cron calls safe (INSERT fails with unique violation for duplicates).
create unique index activity_log_checkin_dedup
  on public.activity_log (user_id, (metadata->>'type'), to_utc_date(created_at))
  where action = 'checkin_sent';
