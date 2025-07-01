-- Migration 001: Create GCP config table
-- This migration ensures the gcp_config table exists with the proper structure
-- for the config-driven architecture

CREATE TABLE IF NOT EXISTS gcp_config_backup AS SELECT * FROM gcp_config;

-- Create the standardized gcp_config table structure
CREATE TABLE IF NOT EXISTS gcp_config_standard (
  id SERIAL PRIMARY KEY,
  roof_type TEXT NOT NULL,
  zone TEXT NOT NULL,
  gc_p_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  UNIQUE (roof_type, zone),
  CHECK (gc_p_value > 0)
);

-- Migrate data from existing table if structure differs
INSERT INTO gcp_config_standard (roof_type, zone, gc_p_value)
SELECT roof_type, zone, gc_p_value 
FROM gcp_config
ON CONFLICT (roof_type, zone) DO NOTHING;

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_gcp_config_standard_roof_type_zone 
ON gcp_config_standard(roof_type, zone);

-- Add helpful comments
COMMENT ON TABLE gcp_config_standard IS 'GCP pressure coefficient values by roof type and zone for wind load calculations';
COMMENT ON COLUMN gcp_config_standard.roof_type IS 'Type of roof system (e.g., membrane, metal, tile)';
COMMENT ON COLUMN gcp_config_standard.zone IS 'Wind zone designation for pressure calculations';
COMMENT ON COLUMN gcp_config_standard.gc_p_value IS 'GCP pressure coefficient value';
