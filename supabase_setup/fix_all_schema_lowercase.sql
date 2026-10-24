
-- 1. Create MARK_BATCHES table with correct columns
create table if not exists public.mark_batches (
  id uuid primary key default gen_random_uuid(),
  subject text,
  sectiontitle text,
  teacheremail text,
  created_at timestamptz default now(),
  count integer,
  status text default 'active',
  workspaceid text
);

-- Ensure lowercase columns exist
alter table public.mark_batches add column if not exists sectiontitle text;
alter table public.mark_batches add column if not exists teacheremail text;
alter table public.mark_batches add column if not exists workspaceid text;

-- 2. Create MARKS table
create table if not exists public.marks (
  id uuid primary key default gen_random_uuid(),
  studentemail text,
  subject text,
  sectiontitle text,
  marks numeric,
  teacheremail text,
  publishedat timestamptz default now(),
  type text,
  batchid uuid,
  deleted boolean default false
);

-- Ensure lowercase columns exist
alter table public.marks add column if not exists studentemail text;
alter table public.marks add column if not exists sectiontitle text;
alter table public.marks add column if not exists teacheremail text;
alter table public.marks add column if not exists publishedat timestamptz default now();
alter table public.marks add column if not exists batchid uuid;

-- 3. Create UNOM_REPORTS table
create table if not exists public.unom_reports (
  id uuid primary key default gen_random_uuid(),
  title text,
  teacheremail text,
  workspaceid text,
  subjects jsonb,
  labsubjects jsonb,
  link text,
  created_at timestamptz default now(),
  data jsonb,
  status text default 'active'
);

-- Ensure lowercase columns exist
alter table public.unom_reports add column if not exists teacheremail text;
alter table public.unom_reports add column if not exists workspaceid text;
alter table public.unom_reports add column if not exists labsubjects jsonb;
