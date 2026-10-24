-- Ensure users can update their own profile (including last_seen)
-- First, drop existing policy if it conflicts (optional, but safer to just add a new specific one)
-- But duplicate policies are allowed (OR logic).

CREATE POLICY "Users can update own last_seen" ON profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Also ensure SELECT permission (though usually public or authenticated)
CREATE POLICY "Everyone can read profiles" ON profiles
FOR SELECT
USING (true);
