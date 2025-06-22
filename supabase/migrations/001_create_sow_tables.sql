-- Create projects and sow_outputs tables for SOW generation system
-- with proper Row Level Security (RLS)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Projects table - stores core project input data
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Project identification
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    company_name VARCHAR(255),
    
    -- Building specifications
    square_footage INTEGER,
    building_height DECIMAL(8,2) DEFAULT 30,
    building_dimensions JSONB, -- {length: number, width: number}
    deck_type VARCHAR(50),
    project_type VARCHAR(50), -- 'recover', 'tearoff', 'new'
    roof_slope DECIMAL(8,4) DEFAULT 0.25,
    elevation DECIMAL(8,2),
    exposure_category VARCHAR(10), -- 'B', 'C', 'D'
    
    -- Membrane specifications
    membrane_type VARCHAR(50), -- 'TPO', 'EPDM', 'PVC', etc.
    membrane_thickness VARCHAR(20), -- '60mil', '80mil', etc.
    membrane_material VARCHAR(50),
    selected_membrane_brand VARCHAR(100),
    
    -- Takeoff data
    takeoff_data JSONB, -- Complete takeoff items structure
    
    -- Optional overrides
    basic_wind_speed INTEGER,
    preferred_manufacturer VARCHAR(100),
    includes_tapered_insulation BOOLEAN DEFAULT FALSE,
    user_selected_system VARCHAR(100),
    custom_notes TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SOW outputs table - stores engineering summary and output metadata
CREATE TABLE IF NOT EXISTS sow_outputs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Template and generation metadata
    template_name VARCHAR(100) NOT NULL,
    rationale TEXT,
    asce_version VARCHAR(20), -- '7-10', '7-16', '7-22'
    hvhz BOOLEAN DEFAULT FALSE,
    wind_speed INTEGER,
    
    -- Zone pressure calculations (in PSF, stored as negative for uplift)
    zone1_field DECIMAL(8,2),
    zone1_perimeter DECIMAL(8,2),
    zone2_perimeter DECIMAL(8,2),
    zone3_corner DECIMAL(8,2),
    
    -- Manufacturer and fastening specifications
    manufacturer VARCHAR(100),
    spacing_field VARCHAR(100),
    spacing_perimeter VARCHAR(100),
    spacing_corner VARCHAR(100),
    penetration_depth VARCHAR(50),
    
    -- Takeoff risk assessment
    takeoff_risk VARCHAR(20), -- 'LOW', 'MEDIUM', 'HIGH'
    key_issues TEXT[],
    
    -- PDF file information
    file_url TEXT, -- URL to generated PDF
    filename VARCHAR(255),
    file_size INTEGER, -- File size in bytes
    storage_path TEXT, -- Path in Supabase Storage (optional)
    generation_time_ms INTEGER,
    
    -- Comprehensive engineering summary (JSONB for flexibility)
    engineering_summary JSONB,
    
    -- Additional metadata
    metadata JSONB, -- { engineVersion, calculationFactors, etc. }
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sow_outputs table
CREATE POLICY "Users can view their own SOW outputs" ON sow_outputs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SOW outputs" ON sow_outputs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOW outputs" ON sow_outputs
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SOW outputs" ON sow_outputs
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_address ON projects(address);

CREATE INDEX IF NOT EXISTS idx_sow_outputs_user_id ON sow_outputs(user_id);
CREATE INDEX IF NOT EXISTS idx_sow_outputs_project_id ON sow_outputs(project_id);
CREATE INDEX IF NOT EXISTS idx_sow_outputs_created_at ON sow_outputs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sow_outputs_template_name ON sow_outputs(template_name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sow_outputs_updated_at 
    BEFORE UPDATE ON sow_outputs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE projects IS 'Core project input data from the frontend form';
COMMENT ON TABLE sow_outputs IS 'Engineering summary and PDF metadata for generated SOWs';

COMMENT ON COLUMN projects.takeoff_data IS 'Complete takeoff items structure including drains, penetrations, flashing, etc.';
COMMENT ON COLUMN sow_outputs.engineering_summary IS 'Complete engineering summary from the SOW generation engine';
COMMENT ON COLUMN sow_outputs.metadata IS 'Additional metadata including engine version, calculation factors, etc.';
COMMENT ON COLUMN sow_outputs.zone1_field IS 'Zone 1 field pressure in PSF (negative for uplift)';
COMMENT ON COLUMN sow_outputs.zone2_perimeter IS 'Zone 2 perimeter pressure in PSF (negative for uplift)';
COMMENT ON COLUMN sow_outputs.zone3_corner IS 'Zone 3 corner pressure in PSF (negative for uplift)';
