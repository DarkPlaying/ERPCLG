
-- 1. Fix ATTENDANCE table columns
-- Ensure workspaceId is consistently 'workspaceId' (CamelCase)
do $$
begin
  -- Rename lowercase 'workspaceid' if it exists
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='attendance' and column_name='workspaceid') then
    alter table public.attendance rename column "workspaceid" to "workspaceId";
  end if;

  -- Rename capitalized 'WorkspaceId' if it exists
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='attendance' and column_name='WorkspaceId') then
    alter table public.attendance rename column "WorkspaceId" to "workspaceId";
  end if;
end
$$;

-- Ensure other columns exist
alter table public.attendance add column if not exists "workspaceId" text;
alter table public.attendance add column if not exists "updatedAt" timestamptz default now();
alter table public.attendance add column if not exists "presentStudents" jsonb;
alter table public.attendance add column if not exists "teacherEmail" text;
alter table public.attendance add column if not exists "date" date;
alter table public.attendance add column if not exists "createdAt" timestamptz default now();

-- 2. Fix ATTENDANCE_STATS table
create table if not exists public.attendance_stats (
  id text primary key,
  "totalDays" integer default 0,
  "studentStats" jsonb default '{}'::jsonb,
  "updatedAt" timestamptz default now()
);

alter table public.attendance_stats add column if not exists "totalDays" integer default 0;
alter table public.attendance_stats add column if not exists "studentStats" jsonb default '{}'::jsonb;
alter table public.attendance_stats add column if not exists "updatedAt" timestamptz default now();

-- 3. Fix SUBMISSIONS table
alter table public.submissions add column if not exists "marks" numeric;
alter table public.submissions add column if not exists "gradedAt" timestamptz;
