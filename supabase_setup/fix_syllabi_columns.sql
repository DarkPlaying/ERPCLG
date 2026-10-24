-- ==============================================================================
-- FIX: Syllabi Table Columns
-- ==============================================================================

-- 1. Ensure created_at exists
alter table public.syllabi 
add column if not exists "created_at" timestamptz default now();

-- 2. Ensure consistency between title/name and link/driveLink
-- We will support both by ensuring columns exist, but ideally we migrate to one.
-- Given the code uses 'title' for insert and 'name' for read, we should probably allow 'name' to be an alias or copy.
-- But changing schema is heavy. Let's just ensure the columns needed for INSERT exist.
-- The UI code needs to be updated to read 'title' if 'name' is missing.

-- Check if 'name' exists, if not, maybe rename 'title' to 'name' or keep both?
-- Let's just ensure standard columns exist to prevent insert errors.
alter table public.syllabi add column if not exists "title" text;
alter table public.syllabi add column if not exists "name" text;
alter table public.syllabi add column if not exists "link" text;
alter table public.syllabi add column if not exists "driveLink" text;
alter table public.syllabi add column if not exists "units" text[]; -- Array of text
