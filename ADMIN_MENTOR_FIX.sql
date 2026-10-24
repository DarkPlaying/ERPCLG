
-- ADMIN MENTOR & PERMISSIONS FIX
-- Run this in Supabase SQL Editor

-- 1. Add missing 'mentor' column to workspaces (Fixes "Could not find column" error)
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS mentor text;

-- 2. Grant Write Permissions to Admins (Fixes "Failed to update/save" errors)

-- Workspaces (Assigning Teachers, Creating Batches)
DROP POLICY IF EXISTS "Admins can update workspaces" ON workspaces;
CREATE POLICY "Admins can update workspaces"
ON workspaces FOR UPDATE
TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );

DROP POLICY IF EXISTS "Admins can insert workspaces" ON workspaces;
CREATE POLICY "Admins can insert workspaces"
ON workspaces FOR INSERT
TO authenticated
WITH CHECK ( is_admin() );

DROP POLICY IF EXISTS "Admins can delete workspaces" ON workspaces;
CREATE POLICY "Admins can delete workspaces"
ON workspaces FOR DELETE
TO authenticated
USING ( is_admin() );

-- Profiles (Adding/Deleting Users)
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
CREATE POLICY "Admins can manage profiles"
ON profiles FOR ALL
TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );

-- Teacher Attendance (Marking Attendance)
DROP POLICY IF EXISTS "Admins can manage attendance" ON teacher_attendance;
CREATE POLICY "Admins can manage attendance"
ON teacher_attendance FOR ALL
TO authenticated
USING ( is_admin() )
WITH CHECK ( is_admin() );
