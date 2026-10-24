-- =============================================================================
-- RE-CREATE WORKSPACES TABLE WITH SNAKE_CASE
-- =============================================================================

DROP TABLE IF EXISTS public.workspaces CASCADE;

CREATE TABLE public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    class_teacher TEXT,  -- Changed from "classTeacher" to class_teacher
    mentor TEXT,
    teachers TEXT[] DEFAULT '{}',
    students TEXT[] DEFAULT '{}',
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
        OR profiles.email = workspaces.class_teacher
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
CREATE INDEX idx_workspaces_class_teacher ON public.workspaces(class_teacher);
CREATE INDEX idx_workspaces_mentor ON public.workspaces(mentor);

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Workspaces table RE-CREATED in snake_case!';
  RAISE NOTICE '✅ class_teacher column is now snake_case';
  RAISE NOTICE '========================================';
END $$;
