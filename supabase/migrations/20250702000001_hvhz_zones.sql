-- HVHZ Zones Table for Geographic Wind Zone Management
-- Stores High Velocity Hurricane Zones with precise geographic boundaries

CREATE TABLE hvhz_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_name TEXT NOT NULL,
    county TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'FL',
    zone_type TEXT NOT NULL CHECK (zone_type IN ('hvhz', 'wbdr', 'coastal', 'inland')),
    wind_speed_basic INTEGER NOT NULL, -- Basic wind speed in mph
    wind_speed_ultimate INTEGER, -- Ultimate design wind speed in mph
    
    -- Geographic boundaries using PostGIS
    boundary_polygon GEOMETRY(POLYGON, 4326),
    
    -- Simple bounding box for fast initial filtering
    bbox_north DECIMAL(10, 7) NOT NULL,
    bbox_south DECIMAL(10, 7) NOT NULL,
    bbox_east DECIMAL(10, 6) NOT NULL,
    bbox_west DECIMAL(10, 6) NOT NULL,
    
    -- Additional zone metadata
    description TEXT,
    effective_date DATE DEFAULT CURRENT_DATE,
    asce_version TEXT DEFAULT '7-22',
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE hvhz_zones ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to hvhz_zones" ON hvhz_zones
    FOR SELECT USING (true);

-- Allow full access to service role
CREATE POLICY "Allow full access to service role hvhz_zones" ON hvhz_zones
    FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_hvhz_zones_state_county ON hvhz_zones(state, county);
CREATE INDEX idx_hvhz_zones_zone_type ON hvhz_zones(zone_type);
CREATE INDEX idx_hvhz_zones_wind_speed ON hvhz_zones(wind_speed_basic);
CREATE INDEX idx_hvhz_zones_bbox ON hvhz_zones USING GIST (
    box2d(ST_MakeEnvelope(bbox_west, bbox_south, bbox_east, bbox_north, 4326))
);

-- Create spatial index if PostGIS is available
-- CREATE INDEX IF NOT EXISTS idx_hvhz_zones_boundary ON hvhz_zones USING GIST (boundary_polygon);

-- Create updated_at trigger
CREATE TRIGGER update_hvhz_zones_updated_at 
    BEFORE UPDATE ON hvhz_zones 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Florida HVHZ zones based on ASCE 7-22 and Florida Building Code
INSERT INTO hvhz_zones (
    zone_name, 
    county, 
    zone_type, 
    wind_speed_basic, 
    wind_speed_ultimate,
    bbox_north, 
    bbox_south, 
    bbox_east, 
    bbox_west, 
    description
) VALUES 
-- Miami-Dade County HVHZ
(
    'Miami-Dade HVHZ',
    'Miami-Dade',
    'hvhz',
    175,
    195,
    25.9776, -- North boundary
    25.1372, -- South boundary  
    -80.1239, -- East boundary
    -80.8738, -- West boundary
    'Miami-Dade County High Velocity Hurricane Zone - 175 mph basic wind speed'
),
-- Broward County HVHZ
(
    'Broward HVHZ',
    'Broward', 
    'hvhz',
    175,
    195,
    26.3895, -- North boundary
    25.9372, -- South boundary
    -80.0645, -- East boundary
    -80.5664, -- West boundary
    'Broward County High Velocity Hurricane Zone - 175 mph basic wind speed'
),
-- Monroe County (Keys) HVHZ
(
    'Monroe Keys HVHZ',
    'Monroe',
    'hvhz', 
    180,
    200,
    25.5159, -- North boundary
    24.3963, -- South boundary
    -80.2811, -- East boundary
    -81.8094, -- West boundary
    'Monroe County (Florida Keys) High Velocity Hurricane Zone - 180 mph basic wind speed'
),
-- Palm Beach County Coastal HVHZ
(
    'Palm Beach Coastal HVHZ',
    'Palm Beach',
    'hvhz',
    170,
    190,
    26.9342, -- North boundary
    26.3200, -- South boundary
    -80.0333, -- East boundary
    -80.2250, -- West boundary
    'Palm Beach County Coastal HVHZ - 170 mph basic wind speed'
),
-- Palm Beach County Inland WBDR
(
    'Palm Beach Inland WBDR',
    'Palm Beach',
    'wbdr',
    150,
    170,
    26.9342, -- North boundary
    26.3200, -- South boundary
    -80.2250, -- East boundary
    -80.6500, -- West boundary
    'Palm Beach County Inland Wind-Borne Debris Region - 150 mph basic wind speed'
),
-- Collier County Coastal
(
    'Collier Coastal',
    'Collier',
    'coastal',
    170,
    190,
    26.5434, -- North boundary
    25.6087, -- South boundary
    -81.2500, -- East boundary
    -81.8500, -- West boundary
    'Collier County Coastal Zone - 170 mph basic wind speed'
),
-- Lee County Coastal  
(
    'Lee Coastal',
    'Lee',
    'coastal',
    170,
    190,
    26.9276, -- North boundary
    26.1298, -- South boundary
    -81.7500, -- East boundary
    -82.1500, -- West boundary
    'Lee County Coastal Zone - 170 mph basic wind speed'
),
-- Martin County Coastal
(
    'Martin Coastal',
    'Martin',
    'coastal',
    165,
    185,
    27.2951, -- North boundary
    26.9276, -- South boundary
    -80.1500, -- East boundary
    -80.4500, -- West boundary
    'Martin County Coastal Zone - 165 mph basic wind speed'
),
-- St. Lucie County Coastal
(
    'St. Lucie Coastal',
    'St. Lucie',
    'coastal', 
    160,
    180,
    27.5573, -- North boundary
    27.1298, -- South boundary
    -80.1500, -- East boundary
    -80.6500, -- West boundary
    'St. Lucie County Coastal Zone - 160 mph basic wind speed'
),
-- Indian River County Coastal
(
    'Indian River Coastal',
    'Indian River',
    'coastal',
    155,
    175,
    27.9934, -- North boundary
    27.4298, -- South boundary
    -80.3500, -- East boundary
    -80.7500, -- West boundary
    'Indian River County Coastal Zone - 155 mph basic wind speed'
);

-- Create view for active HVHZ zones
CREATE VIEW active_hvhz_zones AS
SELECT 
    zone_name,
    county,
    state,
    zone_type,
    wind_speed_basic,
    wind_speed_ultimate,
    bbox_north,
    bbox_south,
    bbox_east,
    bbox_west,
    description,
    effective_date
FROM hvhz_zones
WHERE effective_date <= CURRENT_DATE
ORDER BY wind_speed_basic DESC, county;

-- Function to check if coordinates are in HVHZ
CREATE OR REPLACE FUNCTION is_point_in_hvhz(lat DECIMAL, lng DECIMAL)
RETURNS TABLE(
    in_hvhz BOOLEAN,
    zone_info JSONB
) AS $$
DECLARE
    zone_record RECORD;
    result_json JSONB;
BEGIN
    -- Check if point is within any HVHZ bounding box
    SELECT *
    INTO zone_record
    FROM hvhz_zones
    WHERE zone_type IN ('hvhz', 'wbdr')
    AND lat BETWEEN bbox_south AND bbox_north
    AND lng BETWEEN bbox_west AND bbox_east
    ORDER BY wind_speed_basic DESC
    LIMIT 1;
    
    IF FOUND THEN
        result_json := jsonb_build_object(
            'zone_name', zone_record.zone_name,
            'county', zone_record.county,
            'state', zone_record.state,
            'zone_type', zone_record.zone_type,
            'wind_speed_basic', zone_record.wind_speed_basic,
            'wind_speed_ultimate', zone_record.wind_speed_ultimate,
            'description', zone_record.description
        );
        
        RETURN QUERY SELECT true, result_json;
    ELSE
        RETURN QUERY SELECT false, '{}'::jsonb;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get wind speed for coordinates
CREATE OR REPLACE FUNCTION get_wind_speed_for_location(lat DECIMAL, lng DECIMAL)
RETURNS TABLE(
    wind_speed_basic INTEGER,
    wind_speed_ultimate INTEGER,
    zone_info JSONB
) AS $$
DECLARE
    zone_record RECORD;
    result_json JSONB;
BEGIN
    -- Find the highest applicable wind speed zone for the coordinates
    SELECT *
    INTO zone_record
    FROM hvhz_zones
    WHERE lat BETWEEN bbox_south AND bbox_north
    AND lng BETWEEN bbox_west AND bbox_east
    ORDER BY wind_speed_basic DESC
    LIMIT 1;
    
    IF FOUND THEN
        result_json := jsonb_build_object(
            'zone_name', zone_record.zone_name,
            'county', zone_record.county,
            'state', zone_record.state,
            'zone_type', zone_record.zone_type,
            'description', zone_record.description
        );
        
        RETURN QUERY SELECT 
            zone_record.wind_speed_basic,
            zone_record.wind_speed_ultimate,
            result_json;
    ELSE
        -- Default for Florida if no specific zone found
        result_json := jsonb_build_object(
            'zone_name', 'Florida Default',
            'county', 'Unknown',
            'state', 'FL',
            'zone_type', 'inland',
            'description', 'Default Florida wind speed - verify with local jurisdiction'
        );
        
        RETURN QUERY SELECT 140, 160, result_json;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE hvhz_zones IS 'High Velocity Hurricane Zones and wind speed data for geographic lookups';
COMMENT ON FUNCTION is_point_in_hvhz IS 'Determines if coordinates are within an HVHZ zone';
COMMENT ON FUNCTION get_wind_speed_for_location IS 'Returns wind speed requirements for given coordinates';

-- Verify the data was inserted correctly
SELECT 
    zone_name,
    county,
    zone_type,
    wind_speed_basic,
    description
FROM hvhz_zones
ORDER BY wind_speed_basic DESC, county;