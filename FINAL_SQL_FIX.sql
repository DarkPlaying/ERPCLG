-- FINAL SQL FIX FOR CAMELCASE SCHEMA (NUCLEAR VERSION)
-- This script handles dependency issues by dropping ALL policies on affected tables before column renames.

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop all policies on the tables we are about to modify
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('submissions', 'marks', 'unom_reports', 'mark_batches')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- 2. Helper function to safely rename/drop columns
CREATE OR REPLACE FUNCTION public.safe_rename_column(
    p_table text,
    p_old_col text,
    p_new_col text
) RETURNS void AS $$
BEGIN
    -- If lowercase version exists AND camelCase version DOES NOT exist, rename it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table AND column_name = p_old_col
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table AND column_name = p_new_col
    ) THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', p_table, p_old_col, p_new_col);
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Could not rename % in %: %', p_old_col, p_table, SQLERRM;
        END;
    -- If both exist, drop the lowercase one (we prefer camelCase)
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table AND column_name = p_old_col
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = p_table AND column_name = p_new_col
    ) THEN
        BEGIN
            EXECUTE format('ALTER TABLE %I DROP COLUMN %I CASCADE', p_table, p_old_col);
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Could not drop % in %: %', p_old_col, p_table, SQLERRM;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Apply Renames
SELECT public.safe_rename_column('submissions', 'studentemail', 'studentEmail');
SELECT public.safe_rename_column('submissions', 'teacheremail', 'teacherEmail');
SELECT public.safe_rename_column('submissions', 'submittedat', 'submittedAt');
SELECT public.safe_rename_column('submissions', 'assignmenttitle', 'assignmentTitle');
SELECT public.safe_rename_column('submissions', 'filelink', 'link');

SELECT public.safe_rename_column('marks', 'studentemail', 'studentEmail');
SELECT public.safe_rename_column('marks', 'teacheremail', 'teacherEmail');
SELECT public.safe_rename_column('marks', 'publishedat', 'publishedAt');
SELECT public.safe_rename_column('marks', 'sectiontitle', 'sectionTitle');
SELECT public.safe_rename_column('marks', 'batchid', 'batchId');

SELECT public.safe_rename_column('unom_reports', 'teacheremail', 'teacherEmail');
SELECT public.safe_rename_column('unom_reports', 'workspaceid', 'workspaceId');
SELECT public.safe_rename_column('unom_reports', 'labsubjects', 'labSubjects');
SELECT public.safe_rename_column('unom_reports', 'createdat', 'createdAt');

SELECT public.safe_rename_column('mark_batches', 'teacheremail', 'teacherEmail');
SELECT public.safe_rename_column('mark_batches', 'workspaceid', 'workspaceId');
SELECT public.safe_rename_column('mark_batches', 'sectiontitle', 'sectionTitle');

-- 4. RE-CREATE POLICIES using quoted identifiers (CamelCase)

-- SUBMISSIONS
CREATE POLICY "Students can view their own submissions" 
ON public.submissions FOR SELECT 
TO authenticated 
USING (auth.jwt()->>'email' = "studentEmail");

CREATE POLICY "Teachers can view submissions for their email" 
ON public.submissions FOR SELECT 
TO authenticated 
USING (auth.jwt()->>'email' = "teacherEmail");

CREATE POLICY "Students can insert their own submissions" 
ON public.submissions FOR INSERT 
TO authenticated 
WITH CHECK (auth.jwt()->>'email' = "studentEmail");

-- MARKS
CREATE POLICY "Students can view their own marks" 
ON public.marks FOR SELECT 
TO authenticated 
USING (auth.jwt()->>'email' = "studentEmail");

CREATE POLICY "Teachers can view marks they published" 
ON public.marks FOR SELECT 
TO authenticated 
USING (auth.jwt()->>'email' = "teacherEmail");

CREATE POLICY "Teachers can Insert marks" 
ON public.marks FOR INSERT 
TO authenticated 
WITH CHECK (auth.jwt()->>'email' = "teacherEmail");

-- UNOM REPORTS
CREATE POLICY "Teachers can manage unom reports" 
ON public.unom_reports FOR ALL 
TO authenticated 
USING (auth.jwt()->>'email' = "teacherEmail");

CREATE POLICY "Students can view unom reports" 
ON public.unom_reports FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Students can update unom marks" 
ON public.unom_reports FOR UPDATE 
TO authenticated 
USING (true);

-- MARK BATCHES
CREATE POLICY "Teachers can manage their batches" 
ON public.mark_batches FOR ALL 
TO authenticated 
USING (auth.jwt()->>'email' = "teacherEmail");

CREATE POLICY "Authenticated users can view batches" 
ON public.mark_batches FOR SELECT 
TO authenticated 
USING (true);

-- Cleanup helper
DROP FUNCTION public.safe_rename_column(text, text, text);
