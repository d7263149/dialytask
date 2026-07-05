-- Run this once in Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- 1. Habits you want to track daily (sattu piya, gym, study, animation, etc.)
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text default '✅',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 2. One row per (habit, date). App auto-creates today's rows on load.
create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits(id) on delete cascade,
  log_date date not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

create index if not exists logs_log_date_idx on logs (log_date);

-- No seed insert here: each user gets their own starter habits
-- (Breakfast, Lunch, Dinner, Walk, Study) at registration time — see
-- src/app/api/auth/register/route.js's STARTER_HABITS list.

-- Login + per-user data isolation is added by sql/002_users_and_rls.sql —
-- run that file next (it re-enables RLS and adds the user_id column/policies).
