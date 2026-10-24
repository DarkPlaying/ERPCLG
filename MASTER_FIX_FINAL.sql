-- =============================================================================
-- MASTER FIX SCRIPT - Run this ONE script to fix everything
-- Fixes: Email validation, Auto-confirmation, Profile creation, Triggers
-- =============================================================================

-- ==================== PART 1: DISABLE EMAIL RESTRICTIONS ====================
-- Auto-confirm all users (no email verification needed)
CREATE OR REPLACE FUNCTION public.auto_confirm_all_users()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = auth, public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.email_confirmed_at := NOW();
  NEW.confirmed_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_confirm_trigger ON auth.users;
CREATE TRIGGER auto_confirm_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_confirm_all_users();


-- ==================== PART 2: REMOVE OLD PROFILE TRIGGERS ====================
-- Remove all automatic profile creation triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;


-- ==================== PART 3: FIX PROFILES TABLE STRUCTURE ====================
-- Ensure profiles table exists with all needed columns
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'teacher', 'student')) DEFAULT 'student',
    department TEXT DEFAULT '-',
    hashed_password TEXT,
    vta_no TEXT,
    personal_mobile TEXT,
    date_of_joining TEXT,
    date_of_birth TEXT,
    address TEXT,
    current_salary TEXT,
    assignedWorkspaces TEXT[],
    activeSessionId TEXT,
    activeSessionTimestamp TIMESTAMPTZ,
    portalStatus TEXT CHECK (portalStatus IN ('open', 'closed')),
    profile_picture TEXT,
    face_descriptor JSONB,
    has_face BOOLEAN DEFAULT false,
    biometric_cred_id TEXT,
    biometric_cred_ids TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing column if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hashed_password TEXT;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Allow all authenticated operations" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;

-- Create simple permissive policy
CREATE POLICY "Allow all operations for authenticated"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ==================== PART 4: CREATE RPC FUNCTION ====================
CREATE OR REPLACE FUNCTION public.create_user_profile_secure(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_department TEXT DEFAULT '-',
  p_hashed_password TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = p_user_id) INTO user_exists;
  
  IF NOT user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User does not exist in auth.users. ID: ' || p_user_id::TEXT
    );
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'teacher', 'student') THEN
    p_role := 'student';
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    department,
    hashed_password,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    p_email,
    p_full_name,
    p_role,
    COALESCE(p_department, '-'),
    p_hashed_password,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    department = EXCLUDED.department,
    hashed_password = COALESCE(EXCLUDED.hashed_password, profiles.hashed_password),
    updated_at = NOW()
  RETURNING json_build_object(
    'id', id,
    'email', email,
    'role', role,
    'success', true
  ) INTO result;

  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_user_profile_secure TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile_secure TO anon;
GRANT ALL ON public.profiles TO authenticated;


-- ==================== FINAL: SUCCESS MESSAGE ====================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Email auto-confirmation enabled';
  RAISE NOTICE '✅ Old triggers removed';
  RAISE NOTICE '✅ Profiles table structure fixed';
  RAISE NOTICE '✅ RPC function ready';
  RAISE NOTICE '✅ Permissions granted';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'IMPORTANT: Go to Dashboard and disable email confirmation:';
  RAISE NOTICE 'https://supabase.com/dashboard/project/_/auth/providers';
  RAISE NOTICE 'Click Email > Turn OFF "Confirm email" > Save';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'System ready for CSV uploads!';
END $$;
