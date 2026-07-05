-- Run this once in Supabase SQL editor, AFTER 002_users_and_rls.sql has run.
--
-- "Plans" = date-range tasks, per-user (e.g. "Math" from July 10 to July 25,
-- or "Bio" for all of next month). Unlike habits (which run forever until
-- deleted), a plan has a fixed start_date/end_date. When a plan is created,
-- the app (POST /api/plans) generates one plan_logs row per day in that
-- range up front — there's no daily "ensure" step needed since the whole
-- range is known at creation time.

create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  name text not null,
  emoji text not null default '📘',
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create table if not exists plan_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  plan_id uuid not null references plans(id) on delete cascade,
  log_date date not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  unique (plan_id, log_date)
);

create index if not exists plans_user_id_idx on plans (user_id);
create index if not exists plan_logs_user_id_idx on plan_logs (user_id);
create index if not exists plan_logs_log_date_idx on plan_logs (log_date);

alter table plans enable row level security;
alter table plan_logs enable row level security;
-- (no policies -> only the service_role key can touch them, same pattern
-- as habits/logs/app_users/timetable_* — the Next.js server filters every
-- query by the logged-in user's id)
