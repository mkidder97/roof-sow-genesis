-- Create user roles enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('inspector', 'engineer', 'consultant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update user_profiles table to ensure it has the right structure
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role user_role_enum DEFAULT 'inspector';

-- Insert or update the test user with both roles (we'll handle multiple roles via permissions)
INSERT INTO user_profiles (id, email, full_name, role, permissions)
VALUES (
  '44d8fce2-d733-46e4-952c-8777fd7e2d2f'::uuid,
  'kidderswork@gmail.com',
  'Test User',
  'engineer',
  ARRAY['inspector', 'engineer']
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;