-- FIX PROFILES TABLE: RLS Policies and Columns
-- This script ensures the 'profiles' table has the necessary columns and correct RLS policies for user updates.

-- 1. Ensure Columns Exist (Idempotent)
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'vta_no') THEN
        ALTER TABLE public.profiles ADD COLUMN vta_no text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'personal_mobile') THEN
        ALTER TABLE public.profiles ADD COLUMN personal_mobile text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'department') THEN
        ALTER TABLE public.profiles ADD COLUMN department text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_joining') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_joining timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.profiles ADD COLUMN date_of_birth timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'current_salary') THEN
        ALTER TABLE public.profiles ADD COLUMN current_salary text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'profile_updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN profile_updated_at timestamp with time zone;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'custom_fields') THEN
        ALTER TABLE public.profiles ADD COLUMN custom_fields jsonb DEFAULT '{}'::jsonb;
    END IF;
     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen timestamp with time zone;
    END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing restrictive policies to allow fresh start for 'profiles' update rules
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 4. Create Policies
-- Allow users to view anyone's profile (needed for teacher seeing students, etc.)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to UPDATE their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow users to INSERT their own profile (if not created by trigger)
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);
