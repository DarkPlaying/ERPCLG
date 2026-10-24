
-- 1. Create MARK_BATCHES table
create table if not exists public.mark_batches (
  id uuid primary key default gen_random_uuid(),
  subject text,
  "sectionTitle" text,
  "teacherEmail" text,
  created_at timestamptz default now(),
  count integer,
  status text default 'active',
  "workspaceId" text
);

-- Ensure columns exist
alter table public.mark_batches add column if not exists "subject" text;
alter table public.mark_batches add column if not exists "sectionTitle" text;
alter table public.mark_batches add column if not exists "teacherEmail" text;
alter table public.mark_batches add column if not exists "count" integer;
alter table public.mark_batches add column if not exists "workspaceId" text;

-- 2. Create MARKS table
create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  "studentEmail" text,
  subject text,
  "sectionTitle" text,
  marks numeric,
  "teacherEmail" text,
  "publishedAt" timestamptz default now(),
  type text,
  "batchId" uuid references public.mark_batches(id),
  deleted boolean default false
);

alter table public.marks add column if not exists "studentEmail" text;
alter table public.marks add column if not exists "batchId" uuid;
