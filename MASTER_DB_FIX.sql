
-- MASTER FIX SCRIPT
-- Run this entire script in the Supabase SQL Editor to fix:
-- 1. "No exam marks available" (RLS & Data Casing)
-- 2. "Operator does not exist: text = uuid" (Type Mismatch)
-- 3. Column naming inconsistencies

-- ==========================================
-- 1. RENAME COLUMNS (CamelCase -> lowercase)
-- ==========================================
DO $$
BEGIN
  -- Marks Table
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='studentEmail') THEN
    ALTER TABLE "marks" RENAME COLUMN "studentEmail" TO "studentemail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='teacherEmail') THEN
    ALTER TABLE "marks" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='batchId') THEN
    ALTER TABLE "marks" RENAME COLUMN "batchId" TO "batchid";
  END IF;
  
  -- Submissions Table
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='submissions' AND column_name='studentEmail') THEN
    ALTER TABLE "submissions" RENAME COLUMN "studentEmail" TO "studentemail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='submissions' AND column_name='teacherEmail') THEN
    ALTER TABLE "submissions" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  
  -- UNOM Reports Table
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='workspaceId') THEN
    ALTER TABLE "unom_reports" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
END $$;

-- ==========================================
-- 2. CLEAN UP DATA (Ensure Lowercase & Visibility)
-- ==========================================
-- Fix email casing to match Auth (lowercase)
UPDATE marks SET studentemail = lower(studentemail);
UPDATE submissions SET studentemail = lower(studentemail);

-- Undelete all marks (optional, useful if testing deleted rows)
UPDATE marks SET deleted = false;

-- ==========================================
-- 3. FIX RLS POLICIES (Crucial for Student View)
-- ==========================================

-- Fix Marks Visibility (Case-Insensitive)
DROP POLICY IF EXISTS "Students can view their own marks" ON marks;
DROP POLICY IF EXISTS "Enable read access for students" ON marks;

CREATE POLICY "Students can view their own marks"
ON marks FOR SELECT
TO authenticated
USING (
  lower(studentemail) = lower(auth.email())
);

-- Fix UNOM Reports (Text vs UUID Error)
DROP POLICY IF EXISTS "Students can view unom_reports in their workspace" ON unom_reports;

CREATE POLICY "Students can view unom_reports in their workspace"
ON unom_reports FOR SELECT
TO authenticated
USING (
  workspaceid IN (
    -- Cast w.id to text to match unom_reports.workspaceid type
    SELECT w.id::text FROM workspaces w
    WHERE (auth.email() = ANY (w.students))
  )
);
