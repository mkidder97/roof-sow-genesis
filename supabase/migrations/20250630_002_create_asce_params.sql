-- Migration 002: Create ASCE params table
-- This migration creates a config-driven table for ASCE 7 parameters

CREATE TABLE IF NOT EXISTS asce_params (
  id SERIAL PRIMARY KEY,
  param_name TEXT NOT NULL UNIQUE,
  param_value NUMERIC NOT NULL,
  description TEXT,
  unit TEXT,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validation constraints
  CHECK (param_value > 0),
  CHECK (param_name != ''),
  CHECK (LENGTH(param_name) <= 50)
);

-- Seed defaults with comprehensive ASCE parameters
INSERT INTO asce_params (param_name, param_value, description, unit, category) VALUES
  ('Kd', 0.85, 'Wind directionality factor for MWFRS', 'dimensionless', 'wind_factors'),
  ('I', 1.0, 'Importance factor for standard occupancy buildings (Risk Category II)', 'dimensionless', 'importance_factors'),
  ('Kh_15', 0.85, 'Velocity pressure exposure coefficient at 15 ft for Exposure C', 'dimensionless', 'exposure_coefficients'),
  ('Kh_20', 0.90, 'Velocity pressure exposure coefficient at 20 ft for Exposure C', 'dimensionless', 'exposure_coefficients'),
  ('Kh_25', 0.94, 'Velocity pressure exposure coefficient at 25 ft for Exposure C', 'dimensionless', 'exposure_coefficients'),
  ('Kh_30', 0.98, 'Velocity pressure exposure coefficient at 30 ft for Exposure C', 'dimensionless', 'exposure_coefficients'),
  ('Kzt', 1.0, 'Topographic factor for flat terrain', 'dimensionless', 'topographic_factors'),
  ('Gf', 0.85, 'Gust factor for rigid structures', 'dimensionless', 'gust_factors')
ON CONFLICT (param_name) DO UPDATE SET
  param_value = EXCLUDED.param_value,
  description = EXCLUDED.description,
  unit = EXCLUDED.unit,
  category = EXCLUDED.category,
  updated_at = NOW();

-- Create indexes for fast parameter lookups
CREATE INDEX IF NOT EXISTS idx_asce_params_name ON asce_params(param_name);
CREATE INDEX IF NOT EXISTS idx_asce_params_category ON asce_params(category);
CREATE INDEX IF NOT EXISTS idx_asce_params_active ON asce_params(is_active);

-- Create a function to get ASCE parameter values easily
CREATE OR REPLACE FUNCTION get_asce_param(param_name TEXT)
RETURNS NUMERIC AS $$
DECLARE
    param_val NUMERIC;
BEGIN
    SELECT param_value INTO param_val 
    FROM asce_params 
    WHERE asce_params.param_name = get_asce_param.param_name 
    AND is_active = TRUE;
    
    IF param_val IS NULL THEN
        RAISE EXCEPTION 'ASCE parameter % not found or inactive', param_name;
    END IF;
    
    RETURN param_val;
END;
$$ LANGUAGE plpgsql;

-- Add helpful comments
COMMENT ON TABLE asce_params IS 'ASCE 7 parameters for wind load calculations stored in config-driven format';
COMMENT ON COLUMN asce_params.param_name IS 'Unique parameter identifier (e.g., Kd, I, Kh_15)';
COMMENT ON COLUMN asce_params.param_value IS 'Numerical value of the parameter';
COMMENT ON COLUMN asce_params.description IS 'Human-readable description of the parameter';
COMMENT ON COLUMN asce_params.unit IS 'Unit of measurement (dimensionless, psf, etc.)';
COMMENT ON COLUMN asce_params.category IS 'Parameter category for organization';
COMMENT ON COLUMN asce_params.is_active IS 'Whether this parameter is currently active/valid';
COMMENT ON FUNCTION get_asce_param(TEXT) IS 'Helper function to retrieve ASCE parameter values by name';
