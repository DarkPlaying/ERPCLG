-- ==============================================================================
-- FIX: Add missing 'created_at' column to submissions table
-- ==============================================================================
-- The error "column submissions.created_at does not exist" indicates this timestamp is missing.

alter table public.submissions 
add column if not exists "created_at" timestamptz default now();

-- Verify strict consistency for other common timestamp columns just in case
alter table public.exams add column if not exists "created_at" timestamptz default now();
alter table public.announcements add column if not exists "created_at" timestamptz default now();
