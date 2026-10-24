
-- Fix Security Advisor "Function Search Path Mutable" warnings
-- This ensures functions are not vulnerable to search path hijacking.

-- 1. public.is_admin
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 2. public.confirm_user_by_email
create or replace function public.confirm_user_by_email(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set email_confirmed_at = now()
  where email = target_email;
end;
$$;

-- 3. public.get_auth_email (if it exists, we wrap it with search_path)
-- Note: If this function doesn't exist, this block will fail but others will pass.
-- We use a DO block to check existence if possible, or just define it if it's standard.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'get_auth_email') then
    execute 'alter function public.get_auth_email() set search_path = public';
  end if;
end
$$;

-- 4. public.handle_new_user (Already has it in some versions, but let's be sure)
alter function public.handle_new_user() set search_path = public;
