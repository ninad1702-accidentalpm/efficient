-- ============================================================
-- Migration 006: Recurring Tasks
-- ============================================================

-- 1. recurring_tasks table
create table public.recurring_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  interval int not null default 1 check (interval >= 1),
  days_of_week int[] default null,       -- 0=Sun..6=Sat, used when frequency='weekly'
  day_of_month int default null,         -- 1-31, used when frequency='monthly'
  start_date date not null default current_date,
  end_date date default null,
  max_occurrences int default null,
  created_at timestamptz not null default now(),
  archived_at timestamptz default null
);

alter table public.recurring_tasks enable row level security;

create policy "Users can view own recurring tasks"
  on public.recurring_tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own recurring tasks"
  on public.recurring_tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recurring tasks"
  on public.recurring_tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own recurring tasks"
  on public.recurring_tasks for delete
  using (auth.uid() = user_id);

-- 2. Add recurring_task_id FK on tasks
alter table public.tasks
  add column recurring_task_id uuid references public.recurring_tasks(id) on delete set null;

-- 3. Dedup index: one instance per rule per due_date
create unique index tasks_recurring_dedup
  on public.tasks (recurring_task_id, due_date)
  where recurring_task_id is not null;

-- 4. Update status constraint to include 'skipped'
alter table public.tasks drop constraint tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('pending', 'someday', 'snoozed', 'completed', 'skipped'));

-- 5. Add 'app' as valid actor in activity_log
alter table public.activity_log drop constraint activity_log_actor_check;
alter table public.activity_log add constraint activity_log_actor_check
  check (actor in ('user', 'ai', 'app'));
