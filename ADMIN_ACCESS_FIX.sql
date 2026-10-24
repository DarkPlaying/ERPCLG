
-- ADMIN ACCESS FIX SCRIPT
-- Run this in Supabase SQL Editor to make data visible in Admin Dashboard.

-- 1. Create Helper Function to identifying Admins safely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Profiles Table Policies (Fixes "0 Users", "0 Students" stats)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING ( is_admin() );

-- Emergency Super Admin Policy (Matches your login email)
DROP POLICY IF EXISTS "Super Admin Access" ON profiles;
CREATE POLICY "Super Admin Access"
ON profiles FOR ALL
TO authenticated
USING ( auth.email() = 'sanjay@gmail.com' );

-- 3. Workspaces Table Policies (Fixes Workspaces count)
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all workspaces" ON workspaces;
CREATE POLICY "Admins can view all workspaces"
ON workspaces FOR SELECT
TO authenticated
USING ( is_admin() );

-- 4. Teacher Attendance Table Policies
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all attendance" ON teacher_attendance;
CREATE POLICY "Admins can view all attendance"
ON teacher_attendance FOR SELECT
TO authenticated
USING ( is_admin() );

-- 5. Fix Role for your user (Just in case it's not set to admin)
UPDATE profiles SET role = 'admin' WHERE email = 'sanjay@gmail.com';
