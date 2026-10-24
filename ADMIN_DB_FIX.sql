
-- ADMIN DASHBOARD FIX SCRIPT
-- Run this in Supabase SQL Editor to fix "400 Bad Request" errors in Admin Dashboard.

-- 1. Fix 'teacher_attendance' table columns (CamelCase -> snake_case)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='teacher_attendance' AND column_name='dateStr') THEN
    ALTER TABLE "teacher_attendance" RENAME COLUMN "dateStr" TO "date_str";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='teacher_attendance' AND column_name='teacherId') THEN
    ALTER TABLE "teacher_attendance" RENAME COLUMN "teacherId" TO "teacher_id";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='teacher_attendance' AND column_name='teacherName') THEN
    ALTER TABLE "teacher_attendance" RENAME COLUMN "teacherName" TO "teacher_name";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='teacher_attendance' AND column_name='updatedAt') THEN
    ALTER TABLE "teacher_attendance" RENAME COLUMN "updatedAt" TO "updated_at";
  END IF;
END $$;

-- 2. Fix 'workspaces' table columns
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='workspaces' AND column_name='classTeacher') THEN
    ALTER TABLE "workspaces" RENAME COLUMN "classTeacher" TO "class_teacher";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='workspaces' AND column_name='createdAt') THEN
    ALTER TABLE "workspaces" RENAME COLUMN "createdAt" TO "created_at";
  END IF;
END $$;

-- 3. Fix 'profiles' table (Common source of 0 Users issue)
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='fullName') THEN
    ALTER TABLE "profiles" RENAME COLUMN "fullName" TO "full_name";
  END IF;
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='profiles' AND column_name='photoUrl') THEN
    ALTER TABLE "profiles" RENAME COLUMN "photoUrl" TO "photo_url"; -- Using standard naming if needed, code uses explicit check
  END IF;
END $$;
