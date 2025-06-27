-- Fix missing INSERT policy for user_profiles table
-- This allows users to create their own profile during sign-up

-- Add missing INSERT policy
CREATE POLICY "Users can insert their own profile" 
ON user_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Verify all policies are in place
COMMENT ON POLICY "Users can insert their own profile" ON user_profiles IS 
'Allows users to create their own profile record during registration';