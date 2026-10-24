-- =======================================================
-- CREATE USER LOGINS AUDIT TABLE FOR LIVE RECENT LOGINS
-- =======================================================

CREATE TABLE IF NOT EXISTS public.user_logins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'student',
    department TEXT DEFAULT 'General',
    login_time TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_user_logins_time ON public.user_logins(login_time DESC);
CREATE INDEX IF NOT EXISTS idx_user_logins_user_id ON public.user_logins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_logins_email ON public.user_logins(email);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_logins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all login records (or admin role)
DROP POLICY IF EXISTS "Authenticated users can view user logins" ON public.user_logins;
CREATE POLICY "Authenticated users can view user logins"
ON public.user_logins
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users or service to insert login records
DROP POLICY IF EXISTS "Users can insert their own login records" ON public.user_logins;
CREATE POLICY "Users can insert their own login records"
ON public.user_logins
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Ensure profiles has last_seen and activeSessionTimestamp columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "activeSessionTimestamp" TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS "activeSessionId" TEXT;

-- Index for profiles last_seen
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen DESC NULLS LAST);
