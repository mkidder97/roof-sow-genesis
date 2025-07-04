-- Enhanced Schema Migration for SOW Generation System
-- Adds comprehensive JSONB fields for wind analysis, HVHZ validation, template selection, and engineering overrides

-- Wind Analysis Results Table
CREATE TABLE IF NOT EXISTS wind_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sow_generation_id UUID REFERENCES sow_generations(id) ON DELETE CASCADE,
    input_parameters JSONB NOT NULL,
    design_wind_speed DECIMAL(5,2) NOT NULL,
    velocity_pressure DECIMAL(6,3) NOT NULL,
    zone_pressures JSONB NOT NULL, -- {field, innerPerimeter, outerPerimeter, corner}
    perimeter_widths JSONB NOT NULL, -- {innerPerimeter, outerPerimeter, corner}
    compliance_flags JSONB NOT NULL, -- {asceStandard, hvhzCompliant, engineeringOverride}
    calculation_notes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HVHZ Analysis Results Table
CREATE TABLE IF NOT EXISTS hvhz_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sow_generation_id UUID REFERENCES sow_generations(id) ON DELETE CASCADE,
    is_hvhz_area BOOLEAN NOT NULL DEFAULT FALSE,
    county VARCHAR(100),
    state VARCHAR(50),
    applicable_requirements JSONB DEFAULT '[]', -- Array of NOA requirements
    compliance_status JSONB NOT NULL, -- {overall, missingRequirements, validApprovals}
    special_requirements JSONB DEFAULT '{}', -- {inspectionRequired, specialFastening, etc.}
    calculation_notes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Template Selection Results Table
CREATE TABLE IF NOT EXISTS template_selection (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sow_generation_id UUID REFERENCES sow_generations(id) ON DELETE CASCADE,
    primary_template JSONB NOT NULL, -- Full TemplateConfiguration object
    fallback_templates JSONB DEFAULT '[]', -- Array of alternative templates
    customizations JSONB DEFAULT '{}', -- {additionalSections, removedSections, modifiedSections}
    content_overrides JSONB DEFAULT '{}', -- {hvhzCompliance, windLoadCalculations, etc.}
    generation_notes TEXT[],
    confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engineering Overrides Table
CREATE TABLE IF NOT EXISTS asce_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sow_generation_id UUID REFERENCES sow_generations(id) ON DELETE CASCADE,
    engineer_id UUID, -- Reference to engineer/user who applied override
    engineer_name VARCHAR(255),
    override_type VARCHAR(100) NOT NULL, -- 'wind_parameters', 'pressure_coefficients', 'hvhz_approval', etc.
    original_values JSONB NOT NULL, -- What the calculated values were
    override_values JSONB NOT NULL, -- What the engineer overrode them to
    justification TEXT NOT NULL, -- Required justification for override
    approval_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by VARCHAR(255),
    approved_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced SOW Generations table with new JSONB fields
ALTER TABLE sow_generations 
ADD COLUMN IF NOT EXISTS wind_analysis_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hvhz_analysis_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_selection_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS engineering_overrides_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS compliance_summary JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS generation_metadata JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_wind_analysis_sow_id ON wind_analysis(sow_generation_id);
CREATE INDEX IF NOT EXISTS idx_hvhz_analysis_sow_id ON hvhz_analysis(sow_generation_id);
CREATE INDEX IF NOT EXISTS idx_template_selection_sow_id ON template_selection(sow_generation_id);
CREATE INDEX IF NOT EXISTS idx_asce_overrides_sow_id ON asce_overrides(sow_generation_id);

-- JSONB indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_wind_analysis_compliance ON wind_analysis USING GIN (compliance_flags);
CREATE INDEX IF NOT EXISTS idx_hvhz_analysis_compliance ON hvhz_analysis USING GIN (compliance_status);
CREATE INDEX IF NOT EXISTS idx_template_selection_template ON template_selection USING GIN (primary_template);
CREATE INDEX IF NOT EXISTS idx_asce_overrides_type ON asce_overrides(override_type);

-- SOW Generation input data indexes
CREATE INDEX IF NOT EXISTS idx_sow_generations_input_data ON sow_generations USING GIN (input_data);
CREATE INDEX IF NOT EXISTS idx_sow_generations_wind_data ON sow_generations USING GIN (wind_analysis_data);
CREATE INDEX IF NOT EXISTS idx_sow_generations_hvhz_data ON sow_generations USING GIN (hvhz_analysis_data);

-- Add constraints
ALTER TABLE asce_overrides 
ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wind_analysis_updated_at 
    BEFORE UPDATE ON wind_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hvhz_analysis_updated_at 
    BEFORE UPDATE ON hvhz_analysis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_template_selection_updated_at 
    BEFORE UPDATE ON template_selection 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asce_overrides_updated_at 
    BEFORE UPDATE ON asce_overrides 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies
ALTER TABLE wind_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvhz_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_selection ENABLE ROW LEVEL SECURITY;
ALTER TABLE asce_overrides ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on auth requirements)
CREATE POLICY "wind_analysis_access" ON wind_analysis FOR ALL USING (true);
CREATE POLICY "hvhz_analysis_access" ON hvhz_analysis FOR ALL USING (true);
CREATE POLICY "template_selection_access" ON template_selection FOR ALL USING (true);
CREATE POLICY "asce_overrides_access" ON asce_overrides FOR ALL USING (true);

-- Add helpful comments
COMMENT ON TABLE wind_analysis IS 'Stores detailed ASCE 7-16/7-22 wind load calculations and analysis results';
COMMENT ON TABLE hvhz_analysis IS 'Stores HVHZ compliance validation results for Florida counties';
COMMENT ON TABLE template_selection IS 'Stores intelligent template selection results and customizations';
COMMENT ON TABLE asce_overrides IS 'Tracks engineering overrides with justification and approval workflow';

COMMENT ON COLUMN wind_analysis.zone_pressures IS 'Zone-specific wind pressures in psf: {field, innerPerimeter, outerPerimeter, corner}';
COMMENT ON COLUMN hvhz_analysis.applicable_requirements IS 'Array of NOA/ESR requirements based on county and project specs';
COMMENT ON COLUMN template_selection.primary_template IS 'Selected template configuration with scoring and reasoning';
COMMENT ON COLUMN asce_overrides.justification IS 'Required engineering justification for any calculation overrides';