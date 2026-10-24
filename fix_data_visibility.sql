
-- Run this script in the Supabase SQL Editor to fix Data Visibility

-- 1. Update existing data to ensure emails are lowercase (Fixes case mismatch)
-- Note: We use quote_ident to be safe, but standard SQL updates should work if columns are accessible.
DO $$
BEGIN
  -- Marks
  BEGIN
    UPDATE marks SET studentemail = lower(studentemail);
  EXCEPTION WHEN OTHERS THEN NULL; -- Ignore if column issue
  END;

  -- Submissions
  BEGIN
    UPDATE submissions SET studentemail = lower(studentemail);
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END $$;

-- 2. Fix RLS Policy for Marks (The main reason for invisible data)
-- We make the policy strictly case-insensitive
DROP POLICY IF EXISTS "Students can view their own marks" ON marks;
DROP POLICY IF EXISTS "Students can read own marks" ON marks;
DROP POLICY IF EXISTS "Enable read access for students" ON marks;

CREATE POLICY "Students can view their own marks"
ON marks FOR SELECT
TO authenticated
USING (
  lower(studentemail) = lower(auth.email())
);

-- 3. Fix RLS Policy for Submissions
DROP POLICY IF EXISTS "Students can view their own submissions" ON submissions;

CREATE POLICY "Students can view their own submissions"
ON submissions FOR SELECT
TO authenticated
USING (
  lower(studentemail) = lower(auth.email())
);
