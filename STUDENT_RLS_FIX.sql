
-- STUDENT & GENERAL ACCESS FIX
-- Run this in Supabase SQL Editor

-- 1. Allow all authenticated users (Students/Teachers) to view profiles
-- This fixes "Teacher Name" not showing in filters, as students couldn't fetch teacher profile data.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles" ON profiles;
CREATE POLICY "Public profiles"
ON profiles FOR SELECT
TO authenticated
USING ( true );

-- 2. Allow all authenticated users to view workspaces (needed/safe for fetching class info)
DROP POLICY IF EXISTS "Public workspaces" ON workspaces;
CREATE POLICY "Public workspaces"
ON workspaces FOR SELECT
TO authenticated
USING ( true ); -- Filter logic handles what they see (e.g. workspace membership)
