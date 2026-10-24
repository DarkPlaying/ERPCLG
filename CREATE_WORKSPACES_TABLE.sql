-- =============================================================================
-- CREATE WORKSPACES TABLE FOR SUPABASE
-- =============================================================================

-- Drop if exists
DROP TABLE IF EXISTS public.workspaces CASCADE;

-- Create workspaces table
CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    "classTeacher" TEXT,  -- Email of class teacher
    mentor TEXT,          -- Email of mentor
    teachers TEXT[] DEFAULT '{}',  -- Array of teacher emails
    students TEXT[] DEFAULT '{}',  -- Array of student emails
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Allow admins full access
CREATE POLICY "Admins full access to workspaces"
  ON public.workspaces
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow teachers to view their assigned workspaces
CREATE POLICY "Teachers view own workspaces"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'teacher'
      AND (
        profiles.email = ANY(workspaces.teachers)
        OR profiles.email = workspaces."classTeacher"
        OR profiles.email = workspaces.mentor
      )
    )
  );

-- Allow students to view their assigned workspaces
CREATE POLICY "Students view own workspaces"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'student'
      AND profiles.email = ANY(workspaces.students)
    )
  );

-- Grant permissions
GRANT ALL ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;

-- Create indexes
CREATE INDEX idx_workspaces_category ON public.workspaces(category);
CREATE INDEX idx_workspaces_class_teacher ON public.workspaces("classTeacher");
CREATE INDEX idx_workspaces_mentor ON public.workspaces(mentor);

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Workspaces table created!';
  RAISE NOTICE '✅ Supports classTeacher and mentor';
  RAISE NOTICE '✅ Teachers and students arrays';
  RAISE NOTICE '========================================';
END $$;
