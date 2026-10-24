-- ==============================================================================
-- FIX: "Queries" column case mismatch & "System" missing rows (406 Error)
-- ==============================================================================

-- 1. Fix 'queries' table: Rename lowercase 'useremail' to camelCase "userEmail"
-- Postgres creates unquoted columns as lowercase. Frontend expects camelCase.
do $$
begin
  if exists(select 1 from information_schema.columns where table_schema='public' and table_name='queries' and column_name='useremail') then
    alter table public.queries rename column "useremail" to "userEmail";
  end if;
end $$;

-- 2. Fix 'system' table: Insert default 'maintenance' row
-- Fixes "406 Not Acceptable" error when fetching system status
insert into public.system (id, enabled) 
values ('maintenance', false) 
on conflict (id) do nothing;

-- 3. Fix 'settings' table: Add default attendance settings
-- Fixes potential 406 errors for global settings
insert into public.settings (id, data) 
values ('attendance', '{}'::jsonb) 
on conflict (id) do nothing;

-- 4. Verify columns exist from previous steps (Idempotent check)
alter table public.submissions add column if not exists "created_at" timestamptz default now();
alter table public.queries add column if not exists "userEmail" text; -- Ensure it exists if rename failed or didn't run
