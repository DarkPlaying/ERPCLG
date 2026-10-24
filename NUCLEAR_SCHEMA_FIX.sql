-- ==============================================================================
-- NUCLEAR FIX: Standardize Schema for Student Dashboard (CamelCase Quoted)
-- ==============================================================================

-- 1. Restore hollow handle_new_user function to prevent errors in old scripts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Standardize Columns to CamelCase (Quoted) to match Application Logic
-- This handles the case where columns were created as lowercase by mistake.

-- SUBMISSIONS TABLE
DO $$ 
BEGIN
  -- studentEmail
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='studentemail') THEN
    ALTER TABLE public.submissions RENAME COLUMN "studentemail" TO "studentEmail";
  ELSEIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='studentEmail') THEN
    ALTER TABLE public.submissions ADD COLUMN "studentEmail" TEXT;
  END IF;

  -- teacherEmail
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='teacheremail') THEN
    ALTER TABLE public.submissions RENAME COLUMN "teacheremail" TO "teacherEmail";
  ELSEIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='teacherEmail') THEN
    ALTER TABLE public.submissions ADD COLUMN "teacherEmail" TEXT;
  END IF;

  -- submittedAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='submittedat') THEN
    ALTER TABLE public.submissions RENAME COLUMN "submittedat" TO "submittedAt";
  ELSEIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='submittedAt') THEN
    ALTER TABLE public.submissions ADD COLUMN "submittedAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- assignmentTitle
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='submissions' AND column_name='assignmenttitle') THEN
    ALTER TABLE public.submissions RENAME COLUMN "assignmenttitle" TO "assignmentTitle";
  END IF;
END $$;

-- MARKS TABLE
DO $$ 
BEGIN
  -- studentEmail
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marks' AND column_name='studentemail') THEN
    ALTER TABLE public.marks RENAME COLUMN "studentemail" TO "studentEmail";
  ELSEIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marks' AND column_name='studentEmail') THEN
    ALTER TABLE public.marks ADD COLUMN "studentEmail" TEXT;
  END IF;

  -- teacherEmail
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marks' AND column_name='teacheremail') THEN
    ALTER TABLE public.marks RENAME COLUMN "teacheremail" TO "teacherEmail";
  END IF;

  -- publishedAt
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marks' AND column_name='publishedat') THEN
    ALTER TABLE public.marks RENAME COLUMN "publishedat" TO "publishedAt";
  ELSEIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='marks' AND column_name='publishedAt') THEN
    ALTER TABLE public.marks ADD COLUMN "publishedAt" TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- UNOM_REPORTS TABLE
DO $$ 
BEGIN
  -- workspaceId
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='workspaceid') THEN
    ALTER TABLE public.unom_reports RENAME COLUMN "workspaceid" TO "workspaceId";
  ELSEIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='workspaceId') THEN
    ALTER TABLE public.unom_reports ADD COLUMN "workspaceId" TEXT;
  END IF;

  -- teacherEmail
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='teacheremail') THEN
    ALTER TABLE public.unom_reports RENAME COLUMN "teacheremail" TO "teacherEmail";
  END IF;
END $$;

-- WORKSPACES TABLE
DO $$ 
BEGIN
  -- students (Ensure it is a matching type)
  -- If it's JSONB, keep it. If it was intended to be text[], we might need migration.
  -- Most scripts show it as JSONB or text[]. Let's ensure it's at least present.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='workspaces' AND column_name='students') THEN
    ALTER TABLE public.workspaces ADD COLUMN "students" JSONB DEFAULT '[]';
  END IF;
END $$;

-- 3. RE-APPLY RLS POLICIES WITH QUOTED IDENTIFIERS
-- This is critical because SQL without quotes defaults to lowercase.

-- SUBMISSIONS
DROP POLICY IF EXISTS "Submissions viewable by staff/owner" ON public.submissions;
CREATE POLICY "Submissions viewable by staff/owner" ON public.submissions FOR ALL USING (
  is_admin() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher' 
  OR public.get_auth_email() = "studentEmail"
);

-- MARKS
DROP POLICY IF EXISTS "Students can view own marks" ON public.marks;
CREATE POLICY "Students can view own marks" ON public.marks FOR SELECT USING (
  public.get_auth_email() = "studentEmail"
);

-- EXAMS
DROP POLICY IF EXISTS "Exams viewable by participants" ON public.exams;
CREATE POLICY "Exams viewable by participants" ON public.exams FOR SELECT USING (
  is_admin() 
  OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'teacher' 
  OR public.get_auth_email() = ANY(students)
);

-- UNOM REPORTS
DROP POLICY IF EXISTS "Authenticated view unom_reports" ON public.unom_reports;
CREATE POLICY "Authenticated view unom_reports" ON public.unom_reports FOR SELECT USING (
  auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "Authenticated update unom_reports" ON public.unom_reports;
CREATE POLICY "Authenticated update unom_reports" ON public.unom_reports FOR UPDATE USING (
  auth.role() = 'authenticated'
);

-- 4. GRANT PERMISSIONS
GRANT ALL ON public.submissions TO authenticated;
GRANT ALL ON public.marks TO authenticated;
GRANT ALL ON public.unom_reports TO authenticated;
GRANT ALL ON public.workspaces TO authenticated;

-- 5. RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
