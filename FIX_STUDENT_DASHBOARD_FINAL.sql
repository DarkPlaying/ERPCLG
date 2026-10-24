-- ==============================================================================
-- FINAL FIX: RLS Policies, Column Casing, and Trigger Function Restoration
-- ==============================================================================

-- 1. Restore hollow handle_new_user function to prevent errors in old scripts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- This function is now superseded by public.create_user_profile_secure
  -- but we keep it here to prevent "function does not exist" errors.
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fix RLS policies for case-sensitive (quoted) columns
-- Many columns like "studentEmail", "teacherEmail", "workspaceId" are quoted in the schema.
-- RLS policies must also use quotes to match them.

-- SUBMISSIONS: Fix "studentEmail" and "teacherEmail"
DROP POLICY IF EXISTS "Submissions viewable by staff/owner" ON public.submissions;
CREATE POLICY "Submissions viewable by staff/owner" ON public.submissions FOR ALL USING (
  is_admin() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher' 
  OR public.get_auth_email() = "studentEmail"
);

-- MARKS: Fix "studentEmail"
DROP POLICY IF EXISTS "Students can view own marks" ON public.marks;
CREATE POLICY "Students can view own marks" ON public.marks FOR SELECT USING (
  public.get_auth_email() = "studentEmail"
);

-- EXAMS: Ensure "workspaceId" and array contains check is solid
DROP POLICY IF EXISTS "Exams viewable by participants" ON public.exams;
CREATE POLICY "Exams viewable by participants" ON public.exams FOR SELECT USING (
  is_admin() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher' 
  OR public.get_auth_email() = ANY(students)
);

-- UNOM REPORTS: Ensure "workspaceId" and "teacherEmail" are accessible
-- Policies are usually wide open for authenticated in this project, but let's be safe.
DROP POLICY IF EXISTS "Authenticated view unom_reports" ON public.unom_reports;
CREATE POLICY "Authenticated view unom_reports" ON public.unom_reports FOR SELECT USING (
  auth.role() = 'authenticated'
);

-- 3. Fix Column Names in Case they were created incorrectly
-- Ensure submittedAt and publishedAt are accessible via camelCase (quoted)

DO $$ 
BEGIN
  -- Submissions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='submittedat') THEN
    ALTER TABLE public.submissions RENAME COLUMN "submittedat" TO "submittedAt";
  END IF;
  
  -- Marks
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marks' AND column_name='publishedat') THEN
    ALTER TABLE public.marks RENAME COLUMN "publishedat" TO "publishedAt";
  END IF;

  -- Workspaces
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='workspaceid') THEN
    ALTER TABLE public.workspaces RENAME COLUMN "workspaceid" TO "workspaceId";
  END IF;
END $$;

-- 4. Reload Schema for PostgREST
NOTIFY pgrst, 'reload schema';
