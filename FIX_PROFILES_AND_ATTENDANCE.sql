-- 1. Fix Profiles Schema (Missing columns for Teacher Profile)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vta_no TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_mobile TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_joining TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_salary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Add photoURL (quoted to preserve case if strictly needed, or just text)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "photoURL" TEXT;

-- 2. Create Teacher Attendance Table (Fixes 400 Errors)
CREATE TABLE IF NOT EXISTS teacher_attendance (
    id TEXT PRIMARY KEY,
    "dateStr" TEXT,
    date TIMESTAMP WITH TIME ZONE,
    "teacherId" UUID REFERENCES auth.users(id),
    status TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- 3. Fix Row Level Security (RLS)
-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile columns" ON profiles;
CREATE POLICY "Users can update own profile columns" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow access to teacher_attendance
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can read their own attendance" ON teacher_attendance
FOR SELECT
USING (auth.uid() = "teacherId");

CREATE POLICY "Teachers can insert/update their own attendance" ON teacher_attendance
FOR INSERT
WITH CHECK (auth.uid() = "teacherId");

CREATE POLICY "Teachers can update own attendance" ON teacher_attendance
FOR UPDATE
USING (auth.uid() = "teacherId");

-- 4. Grant Permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON teacher_attendance TO authenticated;
GRANT ALL ON teacher_attendance TO service_role;
