-- Run this once in Supabase SQL editor, AFTER schema.sql and
-- 002_users_and_rls.sql have both already run.
--
-- Older versions of schema.sql seeded 4 starter habits (Sattu piya, Gym
-- kiya, Study, Animation sikha) with no owner (user_id IS NULL). These
-- were never returned to any user (every query filters by user_id), so
-- they're harmless clutter — this just removes them for tidiness.
--
-- New accounts now get their own 5 starter habits (Breakfast, Lunch,
-- Dinner, Walk, Study) at registration time — see STARTER_HABITS in
-- src/app/api/auth/register/route.js. Each user's habits are private to
-- them; nothing here is shared between accounts.

delete from logs where habit_id in (select id from habits where user_id is null);
delete from habits where user_id is null;
