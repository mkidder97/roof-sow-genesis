
-- Add missing columns to field_inspections table
ALTER TABLE field_inspections 
ADD COLUMN IF NOT EXISTS drainage_options jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interior_protection_needed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS interior_protection_sqft integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS conduit_attached boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS upgraded_lighting boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS interior_fall_protection boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS access_method varchar DEFAULT 'internal_hatch',
ADD COLUMN IF NOT EXISTS cover_board_type varchar,
ADD COLUMN IF NOT EXISTS insulation_layers jsonb DEFAULT '[]'::jsonb;
