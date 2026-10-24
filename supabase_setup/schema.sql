-- 1. Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role text check (role in ('admin', 'teacher', 'student')),
  department text default '-',
  vta_no text,
  personal_mobile text,
  date_of_joining text,
  date_of_birth text,
  address text,
  current_salary text,
  assignedWorkspaces text[], /* Array of workspace IDs */
  activeSessionId text,
  activeSessionTimestamp timestamptz,
  hashed_password text, /* Store hash for fallback login */
  portalStatus text check (portalStatus in ('open', 'closed')),
  profile_picture text,
  face_descriptor jsonb,
  has_face boolean default false,
  biometric_cred_id text,
  biometric_cred_ids text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable RLS
alter table public.profiles enable row level security;

-- 2.1. Helper function to check if user is admin without recursion
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$;

-- 3. Profiles Policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id )
  with check ( 
    auth.uid() = id and 
    (is_admin() or (role = (select role from profiles where id = auth.uid()) and email = (select email from profiles where id = auth.uid())))
  );

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Admins can do everything" on profiles;
create policy "Admins can do everything"
  on profiles for all
  using ( is_admin() );

-- 4. Auth Triggers and RPCs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, department)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    coalesce(new.raw_user_meta_data->>'department', '-')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.confirm_user_by_email(target_email text)
returns void
language plpgsql
security definer
as $$
begin
  update auth.users
  set email_confirmed_at = now()
  where email = target_email;
end;
$$;

-- 5. Core Tables
create table if not exists public.workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  teachers text[], /* Array of emails or IDs */
  students text[], /* Array of emails or IDs */
  classTeacher text,
  mentor text,
  created_at timestamptz default now()
);

create table if not exists public.queries (
  id uuid default gen_random_uuid() primary key,
  query text not null,
  userEmail text not null,
  status text default 'pending',
  reply text,
  adminReply text,
  created_at timestamptz default now()
);

create table if not exists public.system (
  id text primary key,
  enabled boolean default false,
  updatedAt timestamptz default now()
);

-- 6. Attendance Tables
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  workspaceId text not null,
  date text not null,
  presentStudents jsonb default '[]',
  teacherEmail text,
  createdAt timestamptz default now(),
  updatedAt timestamptz default now()
);

create table if not exists public.attendance_stats (
  id text primary key, /* Typically workspaceId */
  totalDays integer default 0,
  studentStats jsonb default '{}',
  updatedAt timestamptz default now()
);

create table if not exists public.teacher_attendance (
  id text primary key, /* Structure: YYYY-MM-DD_teacherId */
  dateStr text not null,
  date timestamptz not null,
  teacherId uuid references public.profiles(id) on delete cascade,
  teacherName text,
  department text,
  status text check (status in ('P', 'A', 'HL')),
  remarks text,
  updatedAt timestamptz default now()
);

-- 7. Marks and Reports
create table if not exists public.mark_batches (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  sectionTitle text not null,
  teacherEmail text not null,
  workspaceId text,
  count integer default 0,
  status text default 'published',
  created_at timestamptz default now()
);

create table if not exists public.marks (
  id uuid default gen_random_uuid() primary key,
  studentEmail text not null,
  subject text not null,
  sectionTitle text not null,
  marks text,
  teacherEmail text not null,
  batchId uuid references public.mark_batches(id) on delete cascade,
  publishedAt timestamptz default now(),
  type text,
  deleted boolean default false
);

create table if not exists public.unom_reports (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  teacherEmail text not null,
  workspaceId text not null,
  subjects text[],
  labSubjects text[],
  link text,
  data jsonb,
  status text default 'pending',
  created_at timestamptz default now()
);

-- 8. Academic Content
create table if not exists public.exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  startTime timestamptz,
  endTime timestamptz,
  students text[], /* Array of emails */
  createdBy uuid references public.profiles(id),
  created_at timestamptz default now()
);

create table if not exists public.syllabi (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  link text,
  department text,
  created_at timestamptz default now()
);

create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  priority text default 'normal',
  created_at timestamptz default now()
);

create table if not exists public.submissions (
  id uuid default gen_random_uuid() primary key,
  assignmentId uuid,
  studentId uuid references public.profiles(id),
  studentEmail text,
  fileLink text,
  status text default 'submitted',
  submittedAt timestamptz default now()
);

-- 9. Settings
create table if not exists public.settings (
  id text primary key, /* e.g. 'attendance' */
  data jsonb not null,
  updatedAt timestamptz default now()
);

-- 10. Enable RLS on all tables
alter table public.workspaces enable row level security;
alter table public.queries enable row level security;
alter table public.system enable row level security;
alter table public.attendance enable row level security;
alter table public.attendance_stats enable row level security;
alter table public.teacher_attendance enable row level security;
alter table public.mark_batches enable row level security;
alter table public.marks enable row level security;
alter table public.unom_reports enable row level security;
alter table public.exams enable row level security;
alter table public.syllabi enable row level security;
alter table public.announcements enable row level security;
alter table public.submissions enable row level security;
alter table public.settings enable row level security;

-- 11. Global Policies

-- Workspaces
drop policy if exists "Workspaces viewable by everyone" on workspaces;
create policy "Workspaces viewable by everyone" on workspaces for select using (true);
drop policy if exists "Admins can manage workspaces" on workspaces;
create policy "Admins can manage workspaces" on workspaces for all using (is_admin());

-- Queries
drop policy if exists "Queries viewable by owner and admin" on queries;
create policy "Queries viewable by owner and admin" on queries for select using (
  auth.email() = userEmail or is_admin()
);
drop policy if exists "Users can create queries" on queries;
create policy "Users can create queries" on queries for insert with check (auth.email() = userEmail);
drop policy if exists "Admins can update queries" on queries;
create policy "Admins can update queries" on queries for update using (is_admin());

-- System
drop policy if exists "Everyone can view system" on system;
create policy "Everyone can view system" on system for select using (true);
drop policy if exists "Admins can manage system" on system;
create policy "Admins can manage system" on system for all using (is_admin());

-- Attendance (Student)
drop policy if exists "Teachers can manage attendance" on attendance;
create policy "Teachers can manage attendance" on attendance for all using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher'
);
drop policy if exists "Teachers can manage stats" on attendance_stats;
create policy "Teachers can manage stats" on attendance_stats for all using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher'
);

-- Attendance (Teacher)
drop policy if exists "Admins can manage teacher attendance" on teacher_attendance;
create policy "Admins can manage teacher attendance" on teacher_attendance for all using (is_admin());
drop policy if exists "Teachers can mark own attendance" on teacher_attendance;
create policy "Teachers can mark own attendance" on teacher_attendance for all using (auth.uid() = teacherId);

-- Marks
drop policy if exists "Teachers can manage marks" on mark_batches;
create policy "Teachers can manage marks" on mark_batches for all using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher'
);
drop policy if exists "Teachers can manage mark records" on marks;
create policy "Teachers can manage mark records" on marks for all using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher'
);
drop policy if exists "Students can view own marks" on marks;
create policy "Students can view own marks" on marks for select using (auth.email() = studentEmail);

-- Reports
drop policy if exists "Teachers can manage unom_reports" on unom_reports;
create policy "Teachers can manage unom_reports" on unom_reports for all using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher'
);

-- Exams
drop policy if exists "Exams viewable by participants" on exams;
create policy "Exams viewable by participants" on exams for select using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher' or auth.email() = any(students)
);
drop policy if exists "Teachers can manage exams" on exams;
create policy "Teachers can manage exams" on exams for all using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher'
);

-- Content (Syllabi & Announcements)
drop policy if exists "Authenticated view syllabi" on syllabi;
create policy "Authenticated view syllabi" on syllabi for select using (auth.role() = 'authenticated');
drop policy if exists "Teachers manage syllabi" on syllabi;
create policy "Teachers manage syllabi" on syllabi for all using (is_admin() or (select role from profiles where id = auth.uid()) = 'teacher');
drop policy if exists "Authenticated view announcements" on announcements;
create policy "Authenticated view announcements" on announcements for select using (auth.role() = 'authenticated');
drop policy if exists "Teachers manage announcements" on announcements;
create policy "Teachers manage announcements" on announcements for all using (is_admin() or (select role from profiles where id = auth.uid()) = 'teacher');

-- Submissions
drop policy if exists "Submissions viewable by staff/owner" on submissions;
create policy "Submissions viewable by staff/owner" on submissions for select using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher' or auth.uid() = studentId
);
drop policy if exists "Students create submissions" on submissions;
create policy "Students create submissions" on submissions for insert with check (auth.uid() = studentId);
drop policy if exists "Staff manage submissions" on submissions;
create policy "Staff manage submissions" on submissions for delete using (is_admin() or (select role from profiles where id = auth.uid()) = 'teacher');
drop policy if exists "Owners/Staff update submissions" on submissions;
create policy "Owners/Staff update submissions" on submissions for update using (
  is_admin() or (select role from profiles where id = auth.uid()) = 'teacher' or auth.uid() = studentId
);

-- Settings
drop policy if exists "Admins manage settings" on settings;
create policy "Admins manage settings" on settings for all using (is_admin());
drop policy if exists "Everyone view settings" on settings;
create policy "Everyone view settings" on settings for select using (true);
drop policy if exists "Teachers update portal status" on settings;
create policy "Teachers update portal status" on settings for update using (
  (select role from profiles where id = auth.uid()) = 'teacher' and id != 'attendance'
);
