
-- Create UNOM_REPORTS table with correct columns (lowercase keys seem to be the trend, but we will define them clearly)
-- The code uses CamelCase for keys in the insert object: teacherEmail, workspaceId, labSubjects.
-- However, previous errors showed lowercase requirements for other tables.
-- To be safe, we will create the table with Quoted Identifiers to MATCH the Code's CamelCase keys if we want to support that,
-- OR we create lowercase columns and update the code.
-- Given the "workspaceId" vs "workspaceid" saga, I will create columns in lowercase to be safe for Postgres, 
-- and update the code to use lowercase if needed.
-- BUT, the user code is currently sending `workspaceId`, `teacherEmail`.
-- Let's define the table to accept these keys (using quotes).

create table if not exists public.unom_reports (
  id uuid primary key default gen_random_uuid(),
  title text,
  "teacherEmail" text,
  "workspaceId" text,
  subjects jsonb,
  "labSubjects" jsonb,
  link text,
  created_at timestamptz default now(),
  data jsonb,
  status text default 'active'
);

-- Ensure columns exist
alter table public.unom_reports add column if not exists "teacherEmail" text;
alter table public.unom_reports add column if not exists "workspaceId" text;
alter table public.unom_reports add column if not exists "labSubjects" jsonb;
alter table public.unom_reports add column if not exists "subjects" jsonb;
alter table public.unom_reports add column if not exists "data" jsonb;
alter table public.unom_reports add column if not exists "link" text;
alter table public.unom_reports add column if not exists "status" text;
