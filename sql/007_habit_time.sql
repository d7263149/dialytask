-- Run this once in Supabase SQL editor, AFTER schema.sql has run.
--
-- Optional "from - to" time window per habit (e.g. Gym 6:00 AM - 7:00 AM),
-- stored as "HH:MM" 24-hour text (matches <input type="time"> value format).
-- Both nullable: a habit without a set time just shows no time on the UI.

alter table habits add column if not exists time_from text;
alter table habits add column if not exists time_to text;
