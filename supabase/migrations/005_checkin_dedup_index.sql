-- Prevent duplicate checkin_sent notifications via a unique partial index.
-- Only one checkin_sent per user/type/day is allowed, making concurrent
-- cron calls safe (INSERT fails with unique violation for duplicates).
create unique index activity_log_checkin_dedup
  on public.activity_log (user_id, (metadata->>'type'), date(created_at))
  where action = 'checkin_sent';
