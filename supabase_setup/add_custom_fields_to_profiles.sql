ALTER TABLE profiles ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;
