-- V4 MASTER SCHEMA SCRIPT (Final Fix)
-- This script creates the complete database schema for the EduOnline application, 
-- including support for Firebase backup data and all features in TeacherDashboard.

-- Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES (Users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "email_lower" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "password" TEXT; 
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "activeSessionId" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "activeSessionTimestamp" TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "fcmToken" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "address" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "personal_mobile" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "date_of_birth" TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "date_of_joining" TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "current_salary" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "vta_no" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "portalStatus" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "va_no" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "reg_no" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "batch_year" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "photoURL" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "photoUrl" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "profile_picture" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "hasFace" BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "faceDescriptor" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "uploadedViaCSV" BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "profileUpdatedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "last_seen" TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE;

-- 2. TEACHER ATTENDANCE (System Auto-Absent)
DROP TABLE IF EXISTS "teacher_attendance";
CREATE TABLE "teacher_attendance" (
    "id" TEXT PRIMARY KEY,
    "dateStr" TEXT,
    "date" TIMESTAMP WITH TIME ZONE,
    "teacherId" TEXT,
    "status" TEXT,
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- 3. CLASS ATTENDANCE
CREATE TABLE IF NOT EXISTS "attendance" (
    "id" TEXT PRIMARY KEY,
    "workspaceId" TEXT,
    "teacherEmail" TEXT,
    "date" TEXT,
    "presentStudents" JSONB,
    "createdAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- 4. MARKS (CSV Uploads)
CREATE TABLE IF NOT EXISTS "marks" (
    "id" TEXT PRIMARY KEY,
    "batchId" TEXT,
    "sectionTitle" TEXT,
    "studentEmail" TEXT,
    "type" TEXT,
    "teacherEmail" TEXT,
    "marks" TEXT,
    "subject" TEXT,
    "publishedAt" TIMESTAMP WITH TIME ZONE,
    "deleted" BOOLEAN
);

-- 5. UNOM REPORTS
CREATE TABLE IF NOT EXISTS "unom_reports" (
    "id" TEXT PRIMARY KEY,
    "workspaceId" TEXT,
    "labSubjects" JSONB,
    "subjects" JSONB,
    "data" JSONB,
    "title" TEXT,
    "teacherEmail" TEXT,
    "link" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- 6. WORKSPACES
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT PRIMARY KEY,
    "category" TEXT,
    "students" JSONB,
    "teachers" JSONB,
    "classTeacher" TEXT,
    "mentor" TEXT,
    "adminId" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE
);

-- 7. EXAMS
CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "teacherEmail" TEXT,
    "driveLink" TEXT, -- Added per request
    title TEXT,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 8. SYLLABI
CREATE TABLE IF NOT EXISTS syllabi (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "uploaded_by" TEXT,
    title TEXT,
    units TEXT,
    link TEXT,
    "driveLink" TEXT, -- Added per request
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 9. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "teacherEmail" TEXT,
    title TEXT,
    description TEXT,
    link TEXT,
    "driveLink" TEXT, -- Added per request
    "dueDate" TIMESTAMP WITH TIME ZONE,
    students JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    type TEXT
);

-- 10. SUBMISSIONS (Assignments)
CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "teacherEmail" TEXT,
    "studentEmail" TEXT,
    "assignmentId" TEXT,
    status TEXT DEFAULT 'pending',
    marks NUMERIC,
    "submittedAt" TIMESTAMP WITH TIME ZONE,
    "gradedAt" TIMESTAMP WITH TIME ZONE,
    link TEXT,
    "driveLink" TEXT, -- Added per request
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 11. QUERIES
CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userEmail" TEXT,
    query TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 12. MARK BATCHES
CREATE TABLE IF NOT EXISTS mark_batches (
    id TEXT PRIMARY KEY,
    subject TEXT,
    "sectionTitle" TEXT,
    "teacherEmail" TEXT,
    count INTEGER,
    status TEXT,
    "workspaceId" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 13. SETTINGS
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data JSONB
);

-- 14. SYSTEM
CREATE TABLE IF NOT EXISTS system (
    id TEXT PRIMARY KEY,
    enabled BOOLEAN
);

-- 15. ATTENDANCE STATS
CREATE TABLE IF NOT EXISTS "attendance_stats" (
    id TEXT PRIMARY KEY,
    "totalDays" INTEGER,
    "studentStats" JSONB,
    "updatedAt" TIMESTAMP WITH TIME ZONE
);

-- RLS CONFIGURATION
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE unom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabi ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mark_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_stats ENABLE ROW LEVEL SECURITY;

-- PERMISSIONS (Grant All to Authenticated)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- PERMISSIVE POLICIES (Fixes "400 Bad Request" / "Permission Denied")
DROP POLICY IF EXISTS "Public Profile Access" ON profiles;
CREATE POLICY "Public Profile Access" ON profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Teacher Attendance Access" ON teacher_attendance;
CREATE POLICY "Teacher Attendance Access" ON teacher_attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Attendance Access" ON attendance;
CREATE POLICY "Attendance Access" ON attendance FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Marks Access" ON marks;
CREATE POLICY "Marks Access" ON marks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "UNOM Access" ON unom_reports;
CREATE POLICY "UNOM Access" ON unom_reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Workspaces Access" ON workspaces;
CREATE POLICY "Workspaces Access" ON workspaces FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Exams Access" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Syllabi Access" ON syllabi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Announcements Access" ON announcements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Submissions Access" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Queries Access" ON queries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Mark Batches Access" ON mark_batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Settings Access" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "System Access" ON system FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Attendance Stats Access" ON attendance_stats FOR ALL USING (true) WITH CHECK (true);

-- RELOAD SCHEMA
NOTIFY pgrst, 'reload schema';
