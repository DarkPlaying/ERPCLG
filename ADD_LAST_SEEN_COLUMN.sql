-- Add last_seen column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE;

-- Optional: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);
