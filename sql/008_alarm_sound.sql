-- Run this once in Supabase SQL editor, AFTER 006_alarms.sql has run.
--
-- Per-alarm sound choice. Values match the `key`s in
-- src/lib/clockAudio.js's ALARM_SOUNDS list (classic, chime, digital, bell).

alter table alarms add column if not exists sound text not null default 'classic';
