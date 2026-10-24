-- Add missing columns to profiles table to support Teacher Profile features
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vta_no TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS personal_mobile TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_joining TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_salary TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Ensure RLS allows updates
CREATE POLICY "Users can update own profile columns" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Grant permissions if needed
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Add custom_fields for dynamic teacher profile fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;

-- Add biometric and face recognition columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS face_descriptor TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_face BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_cred_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_cred_ids TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "activeSessionId" TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "activeSessionTimestamp" TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "portalStatus" TEXT DEFAULT 'closed';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "assignedWorkspaces" TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS face_landmarks JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS biometric_data_encrypted TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP WITH TIME ZONE;
