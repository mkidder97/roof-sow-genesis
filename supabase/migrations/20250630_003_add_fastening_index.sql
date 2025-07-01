-- Migration 003: Add fastening patterns table and index for fastener lookups
-- This migration creates the fastening_patterns table and adds performance indexes

-- Create fastening_patterns table if it doesn't exist
CREATE TABLE IF NOT EXISTS fastening_patterns (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  deck_type TEXT NOT NULL,
  insulation_type TEXT NOT NULL,
  zone TEXT NOT NULL,
  pattern_data JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  manufacturer TEXT,
  installation_notes TEXT,
  wind_uplift_rating NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validation constraints
  CHECK (product_id != ''),
  CHECK (deck_type != ''),
  CHECK (insulation_type != ''),
  CHECK (zone != ''),
  CHECK (wind_uplift_rating IS NULL OR wind_uplift_rating > 0),
  
  -- Unique constraint to prevent duplicate patterns
  UNIQUE (product_id, deck_type, insulation_type, zone)
);

-- Add the main performance index for fastener lookups (as specified)
CREATE INDEX IF NOT EXISTS ix_fp_prod_deck_insul_zone
  ON fastening_patterns (product_id, deck_type, insulation_type, zone);

-- Additional indexes for common query patterns and performance optimization
CREATE INDEX IF NOT EXISTS idx_fastening_patterns_product_id ON fastening_patterns(product_id);
CREATE INDEX IF NOT EXISTS idx_fastening_patterns_deck_type ON fastening_patterns(deck_type);
CREATE INDEX IF NOT EXISTS idx_fastening_patterns_insulation_type ON fastening_patterns(insulation_type);
CREATE INDEX IF NOT EXISTS idx_fastening_patterns_zone ON fastening_patterns(zone);
CREATE INDEX IF NOT EXISTS idx_fastening_patterns_active ON fastening_patterns(is_active);
CREATE INDEX IF NOT EXISTS idx_fastening_patterns_manufacturer ON fastening_patterns(manufacturer);

-- Create a GIN index for JSONB pattern_data queries
CREATE INDEX IF NOT EXISTS idx_fastening_patterns_pattern_data_gin 
ON fastening_patterns USING GIN (pattern_data);

-- Create a function to retrieve fastening patterns
CREATE OR REPLACE FUNCTION get_fastening_pattern(
  p_product_id TEXT,
  p_deck_type TEXT,
  p_insulation_type TEXT,
  p_zone TEXT
)
RETURNS fastening_patterns AS $$
DECLARE
    pattern_row fastening_patterns;
BEGIN
    SELECT * INTO pattern_row
    FROM fastening_patterns
    WHERE product_id = p_product_id
      AND deck_type = p_deck_type
      AND insulation_type = p_insulation_type
      AND zone = p_zone
      AND is_active = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active fastening pattern found for product:% deck:% insulation:% zone:%', 
          p_product_id, p_deck_type, p_insulation_type, p_zone;
    END IF;
    
    RETURN pattern_row;
END;
$$ LANGUAGE plpgsql;

-- Create a view for active fastening patterns with summary info
CREATE OR REPLACE VIEW active_fastening_patterns AS
SELECT 
  id,
  product_id,
  deck_type,
  insulation_type,
  zone,
  description,
  manufacturer,
  wind_uplift_rating,
  pattern_data->>'spacing' as fastener_spacing,
  pattern_data->>'type' as fastener_type,
  pattern_data->>'length' as fastener_length,
  created_at,
  updated_at
FROM fastening_patterns
WHERE is_active = TRUE;

-- Add comprehensive comments
COMMENT ON TABLE fastening_patterns IS 'Fastening patterns for roof installations by product, deck type, insulation type, and zone';
COMMENT ON COLUMN fastening_patterns.product_id IS 'Unique identifier for the roofing product';
COMMENT ON COLUMN fastening_patterns.deck_type IS 'Type of roof deck (e.g., steel, concrete, wood)';
COMMENT ON COLUMN fastening_patterns.insulation_type IS 'Type of insulation system used';
COMMENT ON COLUMN fastening_patterns.zone IS 'Wind zone or roof zone designation';
COMMENT ON COLUMN fastening_patterns.pattern_data IS 'JSONB data containing fastening specifications, spacing, types, etc.';
COMMENT ON COLUMN fastening_patterns.wind_uplift_rating IS 'Wind uplift rating in psf for this pattern';
COMMENT ON COLUMN fastening_patterns.is_active IS 'Whether this pattern is currently active/approved for use';

COMMENT ON INDEX ix_fp_prod_deck_insul_zone IS 'Performance index for fastener lookup queries by product, deck, insulation, and zone';

COMMENT ON FUNCTION get_fastening_pattern(TEXT, TEXT, TEXT, TEXT) IS 'Helper function to retrieve active fastening patterns by lookup criteria';

COMMENT ON VIEW active_fastening_patterns IS 'View of active fastening patterns with extracted pattern data for easy querying';
