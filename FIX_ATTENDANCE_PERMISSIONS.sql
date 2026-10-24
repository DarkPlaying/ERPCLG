-- =============================================================================
-- ATTENDANCE TABLE - Fixed Version with Proper Constraints
-- =============================================================================

DROP TABLE IF EXISTS public.teacher_attendance CASCADE;

CREATE TABLE public.teacher_attendance (
    teacher_id TEXT NOT NULL,
    teacher_email TEXT NOT NULL,
    teacher_name TEXT,
    department TEXT,
    date_str TEXT NOT NULL,
    status TEXT CHECK (status IN ('P', 'A', 'HL')),
    remarks TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (teacher_email, date_str)  -- Composite primary key
);

-- Enable RLS
ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- Allow all for admins
CREATE POLICY "Admins full access"
  ON public.teacher_attendance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow teachers to manage their own
CREATE POLICY "Teachers manage own"
  ON public.teacher_attendance
  FOR ALL
  TO authenticated
  USING (
    teacher_id = auth.uid()::TEXT
    OR teacher_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- Permissions
GRANT ALL ON public.teacher_attendance TO authenticated;
GRANT ALL ON public.teacher_attendance TO service_role;

-- Indexes
CREATE INDEX idx_attendance_date ON public.teacher_attendance(date_str);
CREATE INDEX idx_attendance_teacher ON public.teacher_attendance(teacher_id);

DO $$
BEGIN
  RAISE NOTICE '✅ Table created with composite primary key (teacher_email, date_str)';
  RAISE NOTICE '✅ No more ID conflicts!';
END $$;
