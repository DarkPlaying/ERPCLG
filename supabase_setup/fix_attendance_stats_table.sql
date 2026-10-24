
-- Fix attendance_stats table columns
create table if not exists public.attendance_stats (
  id text primary key,
  "totalDays" integer default 0,
  "studentStats" jsonb default '{}'::jsonb,
  "updatedAt" timestamptz default now()
);

-- Ensure columns exist if table already exists
alter table public.attendance_stats add column if not exists "totalDays" integer default 0;
alter table public.attendance_stats add column if not exists "studentStats" jsonb default '{}'::jsonb;
alter table public.attendance_stats add column if not exists "updatedAt" timestamptz default now();
