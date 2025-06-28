
-- Step 1: Fix current user role - set developer account as engineer
INSERT INTO user_profiles (id, email, full_name, role) 
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', 'Developer') as full_name,
  'engineer'::user_role_enum
FROM auth.users 
WHERE email IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
  role = 'engineer'::user_role_enum,
  full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
  updated_at = now();

-- Ensure we have the user_role_enum type (in case it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('inspector', 'engineer', 'consultant');
    END IF;
END $$;
