-- Run this once in Supabase SQL editor, AFTER 002_users_and_rls.sql has run.
--
-- Weekly timetable, per-user (like habits). Columns are user-defined time
-- slots (fully dynamic — any label, any number of them). Rows are the 7
-- days of the week. Saving is all-or-nothing: the app's POST /api/timetable
-- replaces a user's entire set of columns + cells in one go (see
-- src/app/api/timetable/route.js), so there's no "add/remove column"
-- migration logic needed here.

create table if not exists timetable_columns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  label text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists timetable_cells (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references app_users(id) on delete cascade,
  column_id uuid not null references timetable_columns(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday .. 6 = Saturday
  content text not null default '',
  created_at timestamptz not null default now(),
  unique (column_id, day_of_week)
);

create index if not exists timetable_columns_user_id_idx on timetable_columns (user_id);
create index if not exists timetable_cells_user_id_idx on timetable_cells (user_id);

alter table timetable_columns enable row level security;
alter table timetable_cells enable row level security;
-- (no policies -> only the service_role key can touch them, same pattern
-- as habits/logs/app_users — real access control is the Next.js server
-- filtering every query by the logged-in user's id)
