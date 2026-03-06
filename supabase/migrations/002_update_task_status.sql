-- ============================================================
-- Migration 002: Update task status values
-- Old: pending | completed | dismissed
-- New: pending | someday | snoozed | completed
-- ============================================================

-- Migrate any existing 'dismissed' rows to 'completed'
update public.tasks set status = 'completed' where status = 'dismissed';

-- Drop the old constraint and add the new one
alter table public.tasks drop constraint tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('pending', 'someday', 'snoozed', 'completed'));
