-- =============================================================================
-- SUPABASE DATABASE SECURITY & ROW LEVEL SECURITY (RLS) HARDENING
-- Project: Edu Online
-- Security Audit & Comprehensive Policy Implementation
-- =============================================================================

-- =============================================================================
-- 1. HELPER SECURITY DEFINER FUNCTIONS (WITH SAFE search_path)
-- =============================================================================

-- Helper function to check if the caller is an Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR email = 'sanjay@gmail.com')
  );
$$;

-- Helper function to check if the caller is a Teacher
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
$$;

-- Function to get the caller's email safely
CREATE OR REPLACE FUNCTION public.get_auth_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = auth, pg_temp
STABLE
AS $$
  SELECT COALESCE(
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    ''
  );
$$;

-- =============================================================================
-- 2. SECURE 'profiles' TABLE
-- =============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all old/insecure policies
DROP POLICY IF EXISTS "Allow all operations for authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Allow all authenticated operations" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Admin full access profiles" ON public.profiles;

-- Policy 1: Authenticated users can view profiles (needed for workspace rosters, teacher/student info)
CREATE POLICY "profiles_select_authenticated"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: Users can insert their own profile; Admins can insert any profile
CREATE POLICY "profiles_insert_own_or_admin"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- Policy 3: Users can update their own profile; Admins can update any profile
CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id OR public.is_admin()
  )
  WITH CHECK (
    auth.uid() = id OR public.is_admin()
  );

-- Policy 4: Only Admins can delete profiles
CREATE POLICY "profiles_delete_admin_only"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- Prevent Privilege Escalation Trigger:
-- Disallows regular users from escalating their own role column to 'admin'
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- If caller is not an admin, reject role modification
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Security Violation: Only system administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- =============================================================================
-- 3. SECURE 'workspaces' TABLE
-- =============================================================================

ALTER TABLE IF EXISTS public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspaces_select_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_all_policy" ON public.workspaces;
DROP POLICY IF EXISTS "workspaces_modify_policy" ON public.workspaces;

-- Authenticated users can view workspaces they belong to, or admins view all
CREATE POLICY "workspaces_select_policy"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR (public.get_auth_email() = ANY(teachers))
    OR (public.get_auth_email() = ANY(students))
    OR (classTeacher = public.get_auth_email())
    OR (mentor = public.get_auth_email())
  );

-- Teachers and Admins can create/update workspaces
CREATE POLICY "workspaces_insert_policy"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR public.is_teacher()
  );

CREATE POLICY "workspaces_update_policy"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin()
    OR (public.get_auth_email() = ANY(teachers))
    OR (classTeacher = public.get_auth_email())
    OR (mentor = public.get_auth_email())
  )
  WITH CHECK (
    public.is_admin()
    OR (public.get_auth_email() = ANY(teachers))
    OR (classTeacher = public.get_auth_email())
    OR (mentor = public.get_auth_email())
  );

CREATE POLICY "workspaces_delete_policy"
  ON public.workspaces
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin()
  );

-- =============================================================================
-- 4. SECURE 'attendance' TABLE
-- =============================================================================

ALTER TABLE IF EXISTS public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_select_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_insert_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_update_policy" ON public.attendance;
DROP POLICY IF EXISTS "attendance_delete_policy" ON public.attendance;

-- Students view their own attendance; Teachers & Admins view all relevant
CREATE POLICY "attendance_select_policy"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR public.is_teacher()
    OR student_email = public.get_auth_email()
    OR student_id = auth.uid()::text
  );

-- Only Teachers and Admins can take or update attendance
CREATE POLICY "attendance_insert_policy"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin() OR public.is_teacher()
  );

CREATE POLICY "attendance_update_policy"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin() OR public.is_teacher()
  );

CREATE POLICY "attendance_delete_policy"
  ON public.attendance
  FOR DELETE
  TO authenticated
  USING (
    public.is_admin() OR public.is_teacher()
  );

-- =============================================================================
-- 5. SECURE 'notifications' TABLE
-- =============================================================================

ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON public.notifications;
DROP POLICY IF EXISTS "notifications_delete_policy" ON public.notifications;

-- Users can only read notifications directed to their user_id or email
CREATE POLICY "notifications_select_policy"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text
    OR user_id = public.get_auth_email()
    OR public.is_admin()
  );

-- Any authenticated user (e.g. teacher or system event) can send notifications
CREATE POLICY "notifications_insert_policy"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Users can mark their own notifications as read
CREATE POLICY "notifications_update_policy"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()::text
    OR user_id = public.get_auth_email()
    OR public.is_admin()
  );

CREATE POLICY "notifications_delete_policy"
  ON public.notifications
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()::text
    OR user_id = public.get_auth_email()
    OR public.is_admin()
  );

-- =============================================================================
-- 6. SECURE 'system' TABLE (Maintenance & Global Flags)
-- =============================================================================

ALTER TABLE IF EXISTS public.system ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_select_policy" ON public.system;
DROP POLICY IF EXISTS "system_all_admin_policy" ON public.system;

-- Anyone authenticated can view system status (to check maintenance mode)
CREATE POLICY "system_select_policy"
  ON public.system
  FOR SELECT
  TO authenticated
  USING (true);

-- Only Admins can modify system configuration
CREATE POLICY "system_all_admin_policy"
  ON public.system
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================================
-- 7. AUDIT COMPLETION NOTICE
-- =============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Supabase Database Security & RLS Hardening Applied Successfully.';
END $$;
