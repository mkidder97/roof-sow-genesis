
-- First, create the basic enums and tables without the automatic user creation trigger

-- Create user role enum
CREATE TYPE user_role_enum AS ENUM ('inspector', 'consultant', 'engineer', 'admin');

-- Create workflow stage enum  
CREATE TYPE workflow_stage_enum AS ENUM ('inspection', 'consultant_review', 'engineering', 'complete');

-- Companies table
CREATE TABLE companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles table for role management
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role_enum NOT NULL DEFAULT 'inspector',
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    permissions TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_user_email UNIQUE(email)
);

-- Project handoffs table
CREATE TABLE project_handoffs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    from_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    from_stage workflow_stage_enum NOT NULL,
    to_stage workflow_stage_enum NOT NULL,
    handoff_data JSONB DEFAULT '{}',
    notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow activities log
CREATE TABLE workflow_activities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    stage_from workflow_stage_enum,
    stage_to workflow_stage_enum,
    data_changes JSONB DEFAULT '{}',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consultant review data table
CREATE TABLE consultant_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    consultant_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
    field_inspection_id UUID REFERENCES field_inspections(id) ON DELETE CASCADE,
    
    client_requirements JSONB DEFAULT '{}',
    special_conditions TEXT,
    budget_considerations TEXT,
    timeline_requirements TEXT,
    scope_modifications JSONB DEFAULT '{}',
    additional_work_items JSONB DEFAULT '{}',
    exclusions TEXT,
    bid_alerts JSONB DEFAULT '{}',
    risk_factors TEXT,
    competitive_considerations TEXT,
    template_preferences TEXT[],
    template_concerns TEXT,
    review_completed BOOLEAN DEFAULT FALSE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    engineer_briefing TEXT,
    priority_items TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments system for collaboration
CREATE TABLE project_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL NOT NULL,
    comment TEXT NOT NULL,
    comment_type TEXT DEFAULT 'general',
    stage workflow_stage_enum,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultant_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_consultant_reviews_project ON consultant_reviews(project_id);
CREATE INDEX idx_project_comments_project ON project_comments(project_id);
CREATE INDEX idx_workflow_activities_project ON workflow_activities(project_id);
CREATE INDEX idx_project_handoffs_project ON project_handoffs(project_id);
