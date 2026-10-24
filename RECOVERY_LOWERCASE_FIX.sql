-- COMPREHENSIVE STABILIZATION SQL (ALL TABLES LOWERCASE)
-- This script ensures ALL critical columns in ALL tables are LOWERCASE (unquoted).

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('submissions', 'marks', 'unom_reports', 'mark_batches', 'exams', 'syllabi', 'announcements', 'attendance', 'profiles', 'workspaces', 'settings')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.safe_rename_to_lower(p_table text, p_camel_col text, p_lower_col text) RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = p_table AND column_name = p_camel_col) 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = p_table AND column_name = p_lower_col) THEN
        EXECUTE format('ALTER TABLE %I RENAME COLUMN %I TO %I', p_table, p_camel_col, p_lower_col);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = p_table AND column_name = p_camel_col) 
    AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = p_table AND column_name = p_lower_col) THEN
        EXECUTE format('ALTER TABLE %I DROP COLUMN %I CASCADE', p_table, p_camel_col);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- SUBMISSIONS
SELECT public.safe_rename_to_lower('submissions', 'studentEmail', 'studentemail');
SELECT public.safe_rename_to_lower('submissions', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('submissions', 'submittedAt', 'submittedat');
SELECT public.safe_rename_to_lower('submissions', 'assignmentTitle', 'assignmenttitle');
SELECT public.safe_rename_to_lower('submissions', 'assignmentId', 'assignmentid');
SELECT public.safe_rename_to_lower('submissions', 'fileLink', 'filelink');
SELECT public.safe_rename_to_lower('submissions', 'gradedAt', 'gradedat');

-- MARKS
SELECT public.safe_rename_to_lower('marks', 'studentEmail', 'studentemail');
SELECT public.safe_rename_to_lower('marks', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('marks', 'publishedAt', 'publishedat');
SELECT public.safe_rename_to_lower('marks', 'sectionTitle', 'sectiontitle');
SELECT public.safe_rename_to_lower('marks', 'batchId', 'batchid');

-- EXAMS
SELECT public.safe_rename_to_lower('exams', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('exams', 'workspaceId', 'workspaceid');
SELECT public.safe_rename_to_lower('exams', 'driveLink', 'drivelink');
SELECT public.safe_rename_to_lower('exams', 'dueDate', 'duedate');

-- ANNOUNCEMENTS
SELECT public.safe_rename_to_lower('announcements', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('announcements', 'workspaceId', 'workspaceid');
SELECT public.safe_rename_to_lower('announcements', 'requiredFields', 'requiredfields');

-- SYLLABI
SELECT public.safe_rename_to_lower('syllabi', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('syllabi', 'workspaceId', 'workspaceid');

-- UNOM REPORTS
SELECT public.safe_rename_to_lower('unom_reports', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('unom_reports', 'workspaceId', 'workspaceid');
SELECT public.safe_rename_to_lower('unom_reports', 'labSubjects', 'labsubjects');

-- MARK BATCHES
SELECT public.safe_rename_to_lower('mark_batches', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('mark_batches', 'workspaceId', 'workspaceid');
SELECT public.safe_rename_to_lower('mark_batches', 'sectionTitle', 'sectiontitle');

-- ATTENDANCE
SELECT public.safe_rename_to_lower('attendance', 'workspaceId', 'workspaceid');
SELECT public.safe_rename_to_lower('attendance', 'teacherEmail', 'teacheremail');
SELECT public.safe_rename_to_lower('attendance', 'presentStudents', 'presentstudents');

-- PROFILES
SELECT public.safe_rename_to_lower('profiles', 'activeSessionId', 'activesessionid');
SELECT public.safe_rename_to_lower('profiles', 'assignedWorkspaces', 'assignedworkspaces');

-- WORKSPACES
SELECT public.safe_rename_to_lower('workspaces', 'classTeacher', 'classteacher');
SELECT public.safe_rename_to_lower('workspaces', 'mentor', 'mentor');

-- SETTINGS
SELECT public.safe_rename_to_lower('settings', 'teacherEmail', 'teacheremail');

-- RE-CREATE PERMISSIVE POLICIES (Example for Submissions)
CREATE POLICY "Enable all for auth" ON public.submissions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.marks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.unom_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.mark_batches FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.exams FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.announcements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.attendance FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.syllabi FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.workspaces FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for auth" ON public.settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP FUNCTION public.safe_rename_to_lower(text, text, text);
