-- Add archived_at timestamp to tasks
alter table public.tasks add column archived_at timestamptz;

-- Add auto_archive_days to profiles (null = disabled, e.g. 7 = archive after 7 days)
alter table public.profiles add column auto_archive_days integer;
