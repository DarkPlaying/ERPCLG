-- ==============================================================================
-- AUTO-FIX: Add missing columns to match Application Logic (Firebase-style sync)
-- ==============================================================================
-- This script safely adds columns if they don't exist. Run this once.

-- 1. EXAMS Table
alter table public.exams add column if not exists "driveLink" text;
alter table public.exams add column if not exists "type" text default 'exam';
alter table public.exams add column if not exists "dueDate" timestamptz;
alter table public.exams add column if not exists "teacherEmail" text;
alter table public.exams add column if not exists "workspaceId" text;

-- 2. SUBMISSIONS Table
alter table public.submissions add column if not exists "assignmentTitle" text;
alter table public.submissions add column if not exists "marks" numeric;
alter table public.submissions add column if not exists "gradedAt" timestamptz;
alter table public.submissions add column if not exists "teacherEmail" text;

-- 3. ANNOUNCEMENTS Table
alter table public.announcements add column if not exists "description" text;
alter table public.announcements add column if not exists "link" text;
alter table public.announcements add column if not exists "students" text[]; -- Array of strings
alter table public.announcements add column if not exists "teacherEmail" text;
alter table public.announcements add column if not exists "workspaceId" text;
alter table public.announcements add column if not exists "type" text;
alter table public.announcements add column if not exists "requiredFields" text[];

-- 4. SYLLABI Table
alter table public.syllabi add column if not exists "units" text[];
alter table public.syllabi add column if not exists "workspaceId" text;
alter table public.syllabi add column if not exists "students" text[];
alter table public.syllabi add column if not exists "uploaded_by" text;
alter table public.syllabi add column if not exists "updated_at" timestamptz default now();

-- 5. TEACHER ATTENDANCE Table (Ensure casing matches what TS expects)
-- Note: You have "teacherId" (quoted) handling in RLS, ensuring column exists here too.
alter table public.teacher_attendance add column if not exists "teacherId" uuid;
alter table public.teacher_attendance add column if not exists "teacherName" text;
alter table public.teacher_attendance add column if not exists "department" text;

-- 6. UNOM REPORTS Table
-- Ensure JSONB data field exists for flexible storage
alter table public.unom_reports add column if not exists "data" jsonb;

-- 7. SYSTEM Table
alter table public.system add column if not exists "routine" text;
alter table public.system add column if not exists "lastBackup" timestamptz;
