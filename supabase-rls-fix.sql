-- Step 1: First disable RLS temporarily to see if that's the issue
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: If you want proper RLS, re-enable and create appropriate policies:
-- Enable RLS again
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can update their own profile" ON profiles;

-- Create more permissive policies
CREATE POLICY "Anyone can read profiles" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert profiles" 
ON profiles FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update profiles" 
ON profiles FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete profiles" 
ON profiles FOR DELETE 
USING (true);

-- Make sure anon key has access
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role; 