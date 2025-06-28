
-- Check if the INSERT policy exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can insert their own profile'
    ) THEN
        CREATE POLICY "Users can insert their own profile" 
        ON user_profiles 
        FOR INSERT 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- Check if the SELECT policy exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" 
        ON user_profiles 
        FOR SELECT 
        USING (auth.uid() = id);
    END IF;
END $$;

-- Check if the UPDATE policy exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" 
        ON user_profiles 
        FOR UPDATE 
        USING (auth.uid() = id);
    END IF;
END $$;
