
-- ANNOUNCEMENTS DB FIX
-- Run this in Supabase SQL Editor to standardize column names and remove 400 Bad Request errors.

DO $$
BEGIN
  -- targetRole -> target_role
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='announcements' AND column_name='targetRole') THEN
    ALTER TABLE "announcements" RENAME COLUMN "targetRole" TO "target_role";
  END IF;

  -- teacherEmail -> teacheremail
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='announcements' AND column_name='teacherEmail') THEN
    ALTER TABLE "announcements" RENAME COLUMN "teacherEmail" TO "teacheremail";
  END IF;

  -- workspaceId -> workspaceid
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='announcements' AND column_name='workspaceId') THEN
    ALTER TABLE "announcements" RENAME COLUMN "workspaceId" TO "workspaceid";
  END IF;
  
   -- dueDate -> duedate
   IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='announcements' AND column_name='dueDate') THEN
    ALTER TABLE "announcements" RENAME COLUMN "dueDate" TO "duedate";
  END IF;

  -- created_at vs createdAt check? Usually created_at is default.

END $$;
