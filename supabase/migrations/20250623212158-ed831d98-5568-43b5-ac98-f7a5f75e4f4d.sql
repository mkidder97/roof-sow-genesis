
-- Add workflow fields to existing projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_stage workflow_stage_enum DEFAULT 'inspection';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_inspector UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_consultant UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS assigned_engineer UUID REFERENCES user_profiles(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workflow_status JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stage_data JSONB DEFAULT '{}';

-- Add workflow fields to existing field_inspections table
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS observations JSONB DEFAULT '{}';
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS measurements JSONB DEFAULT '{}';
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}';
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS takeoff_items JSONB DEFAULT '{}';
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS recommendations TEXT;
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS concerns TEXT;
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS ready_for_handoff BOOLEAN DEFAULT FALSE;
ALTER TABLE field_inspections ADD COLUMN IF NOT EXISTS handoff_notes TEXT;

-- Add indexes for projects workflow fields
CREATE INDEX idx_projects_stage ON projects(current_stage);
CREATE INDEX idx_projects_inspector ON projects(assigned_inspector);
CREATE INDEX idx_projects_consultant ON projects(assigned_consultant);
CREATE INDEX idx_projects_engineer ON projects(assigned_engineer);
CREATE INDEX idx_field_inspections_project ON field_inspections(project_id);
CREATE INDEX idx_field_inspections_inspector ON field_inspections(inspector_id);

-- Basic RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view profiles in their company" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id OR 
        company_id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

-- Update projects RLS policies
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view assigned projects" ON projects
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() = assigned_inspector OR 
        auth.uid() = assigned_consultant OR 
        auth.uid() = assigned_engineer
    );

CREATE POLICY "Users can update assigned projects" ON projects
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        auth.uid() = assigned_inspector OR 
        auth.uid() = assigned_consultant OR 
        auth.uid() = assigned_engineer
    );

-- Field inspections policies
CREATE POLICY "Inspectors can manage their inspections" ON field_inspections
    FOR ALL USING (auth.uid() = inspector_id);

CREATE POLICY "Project team can view inspections" ON field_inspections
    FOR SELECT USING (
        auth.uid() = inspector_id OR
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = field_inspections.project_id 
            AND (p.assigned_inspector = auth.uid() OR p.assigned_consultant = auth.uid() OR p.assigned_engineer = auth.uid())
        )
    );

-- Consultant reviews policies
CREATE POLICY "Consultants can manage their reviews" ON consultant_reviews
    FOR ALL USING (auth.uid() = consultant_id);

CREATE POLICY "Project team can view reviews" ON consultant_reviews
    FOR SELECT USING (
        auth.uid() = consultant_id OR
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = consultant_reviews.project_id 
            AND (p.assigned_inspector = auth.uid() OR p.assigned_consultant = auth.uid() OR p.assigned_engineer = auth.uid())
        )
    );

-- Comments policies
CREATE POLICY "Users can view project comments" ON project_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_comments.project_id 
            AND (p.assigned_inspector = auth.uid() OR p.assigned_consultant = auth.uid() OR p.assigned_engineer = auth.uid())
        )
    );

CREATE POLICY "Users can add comments to assigned projects" ON project_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_comments.project_id 
            AND (p.assigned_inspector = auth.uid() OR p.assigned_consultant = auth.uid() OR p.assigned_engineer = auth.uid())
        ) AND auth.uid() = user_id
    );

-- Companies policies
CREATE POLICY "Users can view their company" ON companies
    FOR SELECT USING (
        id = (SELECT company_id FROM user_profiles WHERE id = auth.uid())
    );

-- Workflow activities policies
CREATE POLICY "Project team can view activities" ON workflow_activities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = workflow_activities.project_id 
            AND (p.assigned_inspector = auth.uid() OR p.assigned_consultant = auth.uid() OR p.assigned_engineer = auth.uid())
        )
    );

-- Project handoffs policies
CREATE POLICY "Users can view relevant handoffs" ON project_handoffs
    FOR SELECT USING (
        from_user_id = auth.uid() OR 
        to_user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects p 
            WHERE p.id = project_handoffs.project_id 
            AND (p.assigned_inspector = auth.uid() OR p.assigned_consultant = auth.uid() OR p.assigned_engineer = auth.uid())
        )
    );

-- Trigger to automatically create user profile on auth user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create updated_at triggers for new tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_consultant_reviews_updated_at BEFORE UPDATE ON consultant_reviews
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Recreate the field_inspections updated_at trigger
DROP TRIGGER IF EXISTS update_field_inspections_updated_at ON field_inspections;
CREATE TRIGGER update_field_inspections_updated_at BEFORE UPDATE ON field_inspections
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
