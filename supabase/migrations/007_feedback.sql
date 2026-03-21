-- ============================================================
-- Feedback table
-- ============================================================

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  type text not null default 'general' check (type in ('bug', 'feature', 'general')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);
