-- ==============================================================================
-- FIX: Announcements Table Columns
-- ==============================================================================

alter table public.announcements add column if not exists "dueDate" timestamptz;
alter table public.announcements add column if not exists "type" text default 'general';
alter table public.announcements add column if not exists "read" boolean default false;
alter table public.announcements add column if not exists "sender" text;
alter table public.announcements add column if not exists "created_at" timestamptz default now();

-- Ensure other commonly used columns exist
alter table public.announcements add column if not exists "link" text;
alter table public.announcements add column if not exists "description" text;
alter table public.announcements add column if not exists "workspaceId" text;
alter table public.announcements add column if not exists "students" text[];
alter table public.announcements add column if not exists "teacherEmail" text;
