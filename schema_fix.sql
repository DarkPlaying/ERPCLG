
-- 1. Fix 'unom_reports' table
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='workspaceId') THEN
    ALTER TABLE "unom_reports" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='unom_reports' AND column_name='teacherEmail') THEN
    ALTER TABLE "unom_reports" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
END $$;

-- 2. Fix 'marks' table
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='studentEmail') THEN
    ALTER TABLE "marks" RENAME COLUMN "studentEmail" TO "studentemail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='teacherEmail') THEN
    ALTER TABLE "marks" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='batchId') THEN
    ALTER TABLE "marks" RENAME COLUMN "batchId" TO "batchid";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='sectionTitle') THEN
    ALTER TABLE "marks" RENAME COLUMN "sectionTitle" TO "sectiontitle";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='marks' AND column_name='publishedAt') THEN
    ALTER TABLE "marks" RENAME COLUMN "publishedAt" TO "publishedat";
  END IF;
END $$;

-- 3. Fix 'mark_batches' table
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='mark_batches' AND column_name='teacherEmail') THEN
    ALTER TABLE "mark_batches" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='mark_batches' AND column_name='sectionTitle') THEN
    ALTER TABLE "mark_batches" RENAME COLUMN "sectionTitle" TO "sectiontitle";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='mark_batches' AND column_name='workspaceId') THEN
    ALTER TABLE "mark_batches" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
END $$;

-- 4. Fix 'submissions' table
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='submissions' AND column_name='studentEmail') THEN
    ALTER TABLE "submissions" RENAME COLUMN "studentEmail" TO "studentemail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='submissions' AND column_name='teacherEmail') THEN
    ALTER TABLE "submissions" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='submissions' AND column_name='workspaceId') THEN
    ALTER TABLE "submissions" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='submissions' AND column_name='assignmentTitle') THEN
    ALTER TABLE "submissions" RENAME COLUMN "assignmentTitle" TO "assignmenttitle";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='submissions' AND column_name='submittedAt') THEN
    ALTER TABLE "submissions" RENAME COLUMN "submittedAt" TO "submittedat";
  END IF;
END $$;

-- 5. Fix 'exams', 'syllabi', 'announcements'
DO $$
BEGIN
  -- Exams
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='exams' AND column_name='teacherEmail') THEN
    ALTER TABLE "exams" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='exams' AND column_name='workspaceId') THEN
    ALTER TABLE "exams" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='exams' AND column_name='dueDate') THEN
    ALTER TABLE "exams" RENAME COLUMN "dueDate" TO "duedate";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='exams' AND column_name='driveLink') THEN
    ALTER TABLE "exams" RENAME COLUMN "driveLink" TO "drivelink";
  END IF;

  -- Syllabi
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='syllabi' AND column_name='teacherEmail') THEN
    ALTER TABLE "syllabi" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='syllabi' AND column_name='workspaceId') THEN
    ALTER TABLE "syllabi" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='syllabi' AND column_name='driveLink') THEN
    ALTER TABLE "syllabi" RENAME COLUMN "driveLink" TO "drivelink";
  END IF;

  -- Announcements
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='announcements' AND column_name='teacherEmail') THEN
    ALTER TABLE "announcements" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='announcements' AND column_name='workspaceId') THEN
    ALTER TABLE "announcements" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='announcements' AND column_name='requiredFields') THEN
    ALTER TABLE "announcements" RENAME COLUMN "requiredFields" TO "requiredfields";
  END IF;
END $$;

-- 6. Grant RLS Policies for unom_reports (if not exists)
-- Allow students to read unom_reports if they belong to the workspace
create policy "Students can view unom_reports in their workspace"
on "public"."unom_reports"
as permissive
for select
to authenticated
using (
  (workspaceid IN (
    SELECT w.id::text FROM workspaces w
    WHERE (auth.email() = ANY (w.students))
  ))
);

-- Allow teachers to crud unom_reports
create policy "Teachers can manage their own unom_reports"
on "public"."unom_reports"
as permissive
for all
to authenticated
using (
  (teacheremail = auth.email())
);
