-- TaskBuddy schema. Run this once in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
  category text not null default 'work' check (category in ('learning', 'work', 'ai', 'rocket', 'personal')),
  due_at timestamptz,
  progress smallint check (progress is null or (progress >= 0 and progress <= 100)),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_id_idx on public.tasks (user_id);
create index if not exists tasks_user_status_idx on public.tasks (user_id, status);
create index if not exists tasks_user_completed_at_idx on public.tasks (user_id, completed_at);

-- ---------------------------------------------------------------------------
-- user_settings
-- ---------------------------------------------------------------------------
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark')),
  enable_reminders boolean not null default true,
  highlight_overdue boolean not null default true,
  sound_on boolean not null default true,
  daily_goal integer not null default 5 check (daily_goal > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- activity_log
-- ---------------------------------------------------------------------------
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('created', 'moved', 'completed', 'reopened', 'updated', 'deleted')),
  task_title text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_user_created_idx on public.activity_log (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists user_settings_set_updated_at on public.user_settings;
create trigger user_settings_set_updated_at
  before update on public.user_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- The FastAPI backend connects with the Postgres connection string directly
-- (not through PostgREST), so these policies are defense-in-depth in case the
-- tables are ever queried with the anon/authenticated Supabase keys directly.
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;
alter table public.user_settings enable row level security;
alter table public.activity_log enable row level security;

drop policy if exists "tasks_owner_all" on public.tasks;
create policy "tasks_owner_all" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_settings_owner_all" on public.user_settings;
create policy "user_settings_owner_all" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "activity_log_owner_all" on public.activity_log;
create policy "activity_log_owner_all" on public.activity_log
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
