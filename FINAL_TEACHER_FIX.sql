
-- FINAL TEACHER FIX SCRIPT
-- Run this in Supabase SQL Editor to fix "Failed to save report" and other teacher errors.

-- 1. Add missing columns to 'unom_reports' (Fixes "Could not find column" error)
ALTER TABLE unom_reports ADD COLUMN IF NOT EXISTS lab_subjects jsonb;
ALTER TABLE unom_reports ADD COLUMN IF NOT EXISTS subjects jsonb;
ALTER TABLE unom_reports ADD COLUMN IF NOT EXISTS data jsonb;
ALTER TABLE unom_reports ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE unom_reports ADD COLUMN IF NOT EXISTS status text;

-- 2. Ensure snake_case columns exist (Code uses these)
DO $$
BEGIN
  -- teacherEmail -> teacheremail (If not already renamed)
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='teacherEmail') THEN
    ALTER TABLE "unom_reports" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  
  -- workspaceId -> workspaceid
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='workspaceId') THEN
    ALTER TABLE "unom_reports" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;

   -- labSubjects -> lab_subjects (If it exists as CamelCase)
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='labSubjects') THEN
    ALTER TABLE "unom_reports" RENAME COLUMN "labSubjects" TO "lab_subjects";
  END IF;

END $$;

-- 3. Grant Insert/Update permissions on unom_reports
DROP POLICY IF EXISTS "Admins can manage unom_reports" ON unom_reports;
-- Allow teachers to insert? usually authenticated users can insert if they have permission check in RLS or Code.
-- For now, allow authenticated to INSERT/UPDATE their own.
CREATE POLICY "Teachers can insert unom_reports"
ON unom_reports FOR INSERT
TO authenticated
WITH CHECK ( true ); -- Code checks roles

CREATE POLICY "Teachers can update their unom_reports"
ON unom_reports FOR UPDATE
TO authenticated
USING ( teacheremail = auth.email() );
