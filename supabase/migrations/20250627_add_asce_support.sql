-- Add ASCE 7 and enhanced address fields to field_inspections table
-- Run this migration to support dynamic ASCE version selection

-- Add address fields for geocoding and jurisdiction analysis
ALTER TABLE field_inspections 
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);

-- Add ASCE 7 and wind analysis fields
ALTER TABLE field_inspections
ADD COLUMN IF NOT EXISTS asce_version VARCHAR(20),
ADD COLUMN IF NOT EXISTS wind_speed REAL,
ADD COLUMN IF NOT EXISTS exposure_category VARCHAR(10),
ADD COLUMN IF NOT EXISTS building_classification VARCHAR(10);

-- Add comprehensive ASCE requirements as JSONB for flexibility
ALTER TABLE field_inspections
ADD COLUMN IF NOT EXISTS asce_requirements JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_field_inspections_location ON field_inspections(state, city);
CREATE INDEX IF NOT EXISTS idx_field_inspections_asce_version ON field_inspections(asce_version);
CREATE INDEX IF NOT EXISTS idx_field_inspections_wind_speed ON field_inspections(wind_speed);

-- Add comments for documentation
COMMENT ON COLUMN field_inspections.city IS 'Project city for geocoding and jurisdiction analysis';
COMMENT ON COLUMN field_inspections.state IS 'Project state for building code and HVHZ determination';
COMMENT ON COLUMN field_inspections.zip_code IS 'Project ZIP code for precise location analysis';
COMMENT ON COLUMN field_inspections.asce_version IS 'Selected ASCE 7 version (e.g. ASCE 7-22, ASCE 7-16)';
COMMENT ON COLUMN field_inspections.wind_speed IS 'Design wind speed in mph';
COMMENT ON COLUMN field_inspections.exposure_category IS 'ASCE 7 exposure category (B, C, or D)';
COMMENT ON COLUMN field_inspections.building_classification IS 'ASCE 7 building/risk classification (I, II, III, IV)';
COMMENT ON COLUMN field_inspections.asce_requirements IS 'Complete ASCE requirements including engineer approval status';

-- Update existing records with default values where appropriate
UPDATE field_inspections 
SET 
  state = 'FL',
  asce_version = 'ASCE 7-22',
  exposure_category = 'C',
  building_classification = 'II',
  wind_speed = 140
WHERE 
  state IS NULL 
  AND asce_version IS NULL;

-- Create a function to validate ASCE requirements
CREATE OR REPLACE FUNCTION validate_asce_requirements(requirements JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if all required fields are present
  IF requirements IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Validate required fields exist
  IF NOT (
    requirements ? 'version' AND
    requirements ? 'exposure_category' AND
    requirements ? 'building_classification' AND
    requirements ? 'importance_factor'
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Validate importance factor is a positive number
  IF (requirements->>'importance_factor')::NUMERIC <= 0 THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint for ASCE requirements validation
ALTER TABLE field_inspections 
ADD CONSTRAINT check_asce_requirements_valid 
CHECK (asce_requirements IS NULL OR validate_asce_requirements(asce_requirements));

-- Create view for SOW generation with all required fields
CREATE OR REPLACE VIEW sow_generation_data AS
SELECT 
  fi.*,
  COALESCE(fi.city, 'Unknown City') as project_city,
  COALESCE(fi.state, 'FL') as project_state,
  COALESCE(fi.zip_code, '00000') as project_zip,
  COALESCE(fi.asce_version, 'ASCE 7-22') as project_asce_version,
  COALESCE(fi.wind_speed, 140) as project_wind_speed,
  COALESCE(fi.exposure_category, 'C') as project_exposure_category,
  COALESCE(fi.building_classification, 'II') as project_building_classification,
  CASE 
    WHEN fi.asce_requirements->>'engineer_approved' = 'true' THEN true
    ELSE false
  END as asce_engineer_approved,
  fi.asce_requirements->>'approval_engineer' as asce_approval_engineer,
  fi.asce_requirements->>'approval_date' as asce_approval_date
FROM field_inspections fi;

COMMENT ON VIEW sow_generation_data IS 'Unified view for SOW generation with all required ASCE and location fields';
