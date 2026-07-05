-- Run this once in Supabase SQL editor, AFTER schema.sql has already run.
-- Safe to re-run even if you already ran an older version of this file.
--
-- Adds a plain user id + password login (NOT Supabase Auth — no email
-- involved anywhere) on top of the existing habits/logs tables.
--
-- All app data access now goes through the Next.js server (using the
-- service_role key, which bypasses RLS) rather than directly from the
-- browser. RLS is enabled with NO policies below purely as defense in
-- depth: it locks habits/logs/app_users so the anon/public key — which
-- ships in the browser bundle — cannot read or write them at all, even
-- if someone points a REST client at your Supabase project URL directly.

-- 1. Our own users table. Passwords are bcrypt-hashed by the app before
--    this table ever sees them.
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

alter table app_users enable row level security;
-- (no policies -> only the service_role key can touch this table)

-- 2. Drop any policies from an older (Supabase-Auth-based) version of
--    this migration, if present.
drop policy if exists "habits_select_own" on habits;
drop policy if exists "habits_insert_own" on habits;
drop policy if exists "habits_update_own_or_claim" on habits;
drop policy if exists "habits_delete_own" on habits;
drop policy if exists "logs_select_own" on logs;
drop policy if exists "logs_insert_own" on logs;
drop policy if exists "logs_update_own" on logs;
drop policy if exists "logs_delete_own" on logs;

-- 3. Who owns each habit. Existing rows (created before login existed)
--    are left NULL — the first person to register claims them (handled
--    in src/app/api/auth/register/route.js, no manual SQL needed).
alter table habits add column if not exists user_id uuid;
alter table habits alter column user_id drop default;
alter table habits drop constraint if exists habits_user_id_fkey;
alter table habits add constraint habits_user_id_fkey foreign key (user_id) references app_users(id) on delete cascade;

alter table habits enable row level security;
alter table logs enable row level security;
-- (no policies on either -> only the service_role key can touch them)
