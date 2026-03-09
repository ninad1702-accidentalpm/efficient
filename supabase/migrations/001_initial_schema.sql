-- ============================================================
-- Efficient — Initial Schema
-- ============================================================

-- 1. profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'UTC',
  morning_notification_time time not null default '10:00',
  evening_notification_time time not null default '21:00',
  push_subscription jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'dismissed')),
  due_date date,
  snooze_until timestamptz,
  completed_at timestamptz,
  source text not null default 'manual' check (source in ('manual', 'ai', 'scratch_pad')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- 3. scratch_pad
create table public.scratch_pad (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null default '',
  last_processed_content text,
  updated_at timestamptz not null default now()
);

alter table public.scratch_pad enable row level security;

create policy "Users can view own scratch pad"
  on public.scratch_pad for select
  using (auth.uid() = user_id);

create policy "Users can insert own scratch pad"
  on public.scratch_pad for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scratch pad"
  on public.scratch_pad for update
  using (auth.uid() = user_id);

create policy "Users can delete own scratch pad"
  on public.scratch_pad for delete
  using (auth.uid() = user_id);

-- 4. activity_log
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  actor text not null check (actor in ('user', 'ai')),
  action text not null,
  task_id uuid references public.tasks(id) on delete set null,
  task_title_snapshot text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table public.activity_log enable row level security;

create policy "Users can view own activity log"
  on public.activity_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity log"
  on public.activity_log for insert
  with check (auth.uid() = user_id);

-- 5. ai_suggestions
create table public.ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  suggested_title text not null,
  suggested_due_date date,
  source_text text,
  user_action text check (user_action in ('accepted', 'dismissed', null)),
  task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.ai_suggestions enable row level security;

create policy "Users can view own ai suggestions"
  on public.ai_suggestions for select
  using (auth.uid() = user_id);

create policy "Users can insert own ai suggestions"
  on public.ai_suggestions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own ai suggestions"
  on public.ai_suggestions for update
  using (auth.uid() = user_id);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at on tasks
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute procedure public.update_updated_at();

create trigger scratch_pad_updated_at
  before update on public.scratch_pad
  for each row execute procedure public.update_updated_at();
