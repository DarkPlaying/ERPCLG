-- Helper function to get the current user's email from the JWT
-- Defined in public schema to avoid permission issues with auth schema
create or replace function public.get_auth_email() returns text as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')::text;
$$ language sql stable;

-- ==========================================
-- RLS Policy Updates to match Firestore Rules
-- ==========================================

-- 1. Profiles
-- Firestore: allow read: if isAuthenticated();
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Authenticated profiles view"
  on profiles for select
  using ( auth.role() = 'authenticated' );

-- 2. Workspaces
-- Firestore: allow read: if isAuthenticated();
drop policy if exists "Workspaces viewable by everyone" on workspaces;
create policy "Authenticated workspaces view"
  on workspaces for select
  using ( auth.role() = 'authenticated' );

-- 3. Exams
-- Firestore: allow read: if isAdmin() || isTeacher() || (isAuthenticated() && (resource.data.students.hasAny([getUserEmail()])...));
drop policy if exists "Exams viewable by participants" on exams;
create policy "Exams viewable by participants" on exams for select using (
  is_admin() 
  or (select role from profiles where id = auth.uid()) = 'teacher' 
  or public.get_auth_email() = any(students)
);

-- 4. Syllabi
-- Schema already has: "Authenticated view syllabi" using (auth.role() = 'authenticated') -> OK.

-- 5. Announcements
-- Schema already has: "Authenticated view announcements" using (auth.role() = 'authenticated') -> OK.

-- 6. Submissions
-- Firestore: allow read: if isAdmin() || isTeacher() || (isAuthenticated() && resource.data.studentEmail == getUserEmail());
drop policy if exists "Submissions viewable by staff/owner" on submissions;
create policy "Submissions viewable by staff/owner" on submissions for select using (
  is_admin() 
  or (select role from profiles where id = auth.uid()) = 'teacher' 
  or public.get_auth_email() = studentEmail
);

-- 7. Teacher Attendance
-- Firestore: allow read: if isAdmin() || (isAuthenticated() && (resource.data.teacherId == request.auth.uid ...));
create policy "Teachers view own attendance" on teacher_attendance for select using (
  auth.uid() = teacherId
);

-- 8. Attendance (General/Student)
-- Firestore: allow read: if isAuthenticated();
create policy "Authenticated view attendance"
  on attendance for select
  using ( auth.role() = 'authenticated' );

-- 9. Marks
-- Schema: Students can view own marks (via studentEmail). OK.

-- 10. Unom Reports
-- Firestore: allow read: if isAuthenticated(); update: if isAuthenticated();
create policy "Authenticated view unom_reports"
  on unom_reports for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated update unom_reports"
  on unom_reports for update
  using ( auth.role() = 'authenticated' );

-- 11. System
-- Firestore: allow read: if isAuthenticated();
drop policy if exists "Everyone can view system" on system;
create policy "Authenticated view system"
  on system for select
  using ( auth.role() = 'authenticated' );

-- 12. Settings
-- Firestore: allow read: if isAuthenticated();
drop policy if exists "Everyone view settings" on settings;
create policy "Authenticated view settings"
  on settings for select
  using ( auth.role() = 'authenticated' );
