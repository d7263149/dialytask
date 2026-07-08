-- Run this once in Supabase SQL editor, AFTER 002_users_and_rls.sql has run.
--
-- Alarms for the Clock page. "time" is stored as "HH:MM" (24h, local to
-- whatever the browser's clock says) and re-fires every day it's enabled —
-- ringing itself only happens client-side while the app is open in a tab,
-- same as any web app without a service worker; this table just makes the
-- alarm list follow the logged-in user across devices/browsers.

create table if not exists alarms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  time text not null,
  label text not null default '',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists alarms_user_id_idx on alarms (user_id);

alter table alarms enable row level security;
-- (no policies -> only the service_role key can touch it, same pattern as
-- habits/logs/plans/plan_logs — the Next.js server filters every query by
-- the logged-in user's id)
