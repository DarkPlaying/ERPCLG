-- SYNC PROFILES SCRIPT
-- This script ensures that all users in Supabase Auth have a matching profile in the profiles table.
-- It also sets a default role (student) if no profile exists.

DO $$
DECLARE
    auth_user RECORD;
BEGIN
    FOR auth_user IN (SELECT id, email FROM auth.users) LOOP
        -- Check if profile exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth_user.id) THEN
            RAISE NOTICE 'Creating missing profile for user: % (%)', auth_user.email, auth_user.id;
            
            INSERT INTO public.profiles (id, email, full_name, role, created_at)
            VALUES (
                auth_user.id, 
                auth_user.email, 
                split_part(auth_user.email, '@', 1), -- Use email prefix as default name
                'student', -- Default role
                NOW()
            );
        END IF;
    END LOOP;
END $$;

-- Check for specific users that might be critical
-- Ensure sanjay@gmail.com is an admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'sanjay@gmail.com';

-- Refresh RLS to be sure
NOTIFY pgrst, 'reload schema';
