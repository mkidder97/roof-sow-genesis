-- Migration to create HVHZ zones table for geo service
-- High Velocity Hurricane Zones in Florida

-- Create hvhz_zones table
CREATE TABLE hvhz_zones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    zone_name VARCHAR(255) NOT NULL,
    county VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL DEFAULT 'FL',
    is_hvhz BOOLEAN NOT NULL DEFAULT true,
    
    -- Geographic boundaries (bounding box for simplicity)
    north_bound DECIMAL(10, 8) NOT NULL,
    south_bound DECIMAL(10, 8) NOT NULL,
    east_bound DECIMAL(10, 8) NOT NULL,
    west_bound DECIMAL(10, 8) NOT NULL,
    
    -- Additional metadata
    effective_date DATE DEFAULT CURRENT_DATE,
    code_reference VARCHAR(255),
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_coordinates CHECK (
        north_bound > south_bound AND 
        east_bound > west_bound AND
        north_bound BETWEEN -90 AND 90 AND
        south_bound BETWEEN -90 AND 90 AND
        east_bound BETWEEN -180 AND 180 AND
        west_bound BETWEEN -180 AND 180
    )
);

-- Create indexes for geographic queries
CREATE INDEX idx_hvhz_zones_county_state ON hvhz_zones(county, state);
CREATE INDEX idx_hvhz_zones_coordinates ON hvhz_zones(north_bound, south_bound, east_bound, west_bound);
CREATE INDEX idx_hvhz_zones_is_hvhz ON hvhz_zones(is_hvhz);

-- Seed data for Florida HVHZ zones
INSERT INTO hvhz_zones (zone_name, county, state, is_hvhz, north_bound, south_bound, east_bound, west_bound, code_reference, notes) VALUES
-- Miami-Dade County (entire county is HVHZ)
('Miami-Dade County HVHZ', 'Miami-Dade', 'FL', true, 25.9759, 25.1374, -80.1173, -80.8717, 'FBC 1609.2', 'Entire Miami-Dade County is designated HVHZ'),

-- Broward County (entire county is HVHZ)  
('Broward County HVHZ', 'Broward', 'FL', true, 26.4366, 25.9574, -80.0619, -80.4726, 'FBC 1609.2', 'Entire Broward County is designated HVHZ'),

-- Monroe County (Florida Keys - partial HVHZ)
('Monroe County Keys HVHZ', 'Monroe', 'FL', true, 25.4819, 24.3963, -80.2534, -81.8094, 'FBC 1609.2', 'Florida Keys portion of Monroe County'),

-- Palm Beach County (partial HVHZ - coastal areas)
('Palm Beach County Coastal HVHZ', 'Palm Beach', 'FL', true, 26.7934, 26.0346, -79.9742, -80.3381, 'FBC 1609.2', 'Coastal areas of Palm Beach County within one mile of shore'),

-- Martin County (partial HVHZ - coastal areas)
('Martin County Coastal HVHZ', 'Martin', 'FL', true, 27.2516, 26.9719, -80.1264, -80.4194, 'FBC 1609.2', 'Coastal areas of Martin County within one mile of shore');

-- Add non-HVHZ reference zones for testing
INSERT INTO hvhz_zones (zone_name, county, state, is_hvhz, north_bound, south_bound, east_bound, west_bound, code_reference, notes) VALUES
-- Orange County (Orlando area - not HVHZ)
('Orange County Standard Zone', 'Orange', 'FL', false, 28.7615, 28.3674, -81.1268, -81.6431, 'FBC Standard', 'Orlando metropolitan area - standard wind zone'),

-- Hillsborough County (Tampa area - not HVHZ inland)
('Hillsborough County Inland', 'Hillsborough', 'FL', false, 28.2639, 27.6648, -82.1267, -82.7441, 'FBC Standard', 'Inland Hillsborough County - standard wind zone');

-- Function to check if coordinates are in HVHZ
CREATE OR REPLACE FUNCTION is_hvhz_location(lat DECIMAL(10,8), lng DECIMAL(10,8))
RETURNS TABLE(
    is_hvhz BOOLEAN,
    zone_name VARCHAR(255),
    county VARCHAR(100),
    state VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hz.is_hvhz,
        hz.zone_name,
        hz.county,
        hz.state
    FROM hvhz_zones hz
    WHERE lat BETWEEN hz.south_bound AND hz.north_bound
      AND lng BETWEEN hz.west_bound AND hz.east_bound
    ORDER BY hz.is_hvhz DESC -- Prioritize HVHZ zones over standard zones
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to get county from coordinates
CREATE OR REPLACE FUNCTION get_county_from_coordinates(lat DECIMAL(10,8), lng DECIMAL(10,8))
RETURNS TABLE(
    county VARCHAR(100),
    state VARCHAR(50),
    is_hvhz BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        hz.county,
        hz.state,
        hz.is_hvhz
    FROM hvhz_zones hz
    WHERE lat BETWEEN hz.south_bound AND hz.north_bound
      AND lng BETWEEN hz.west_bound AND hz.east_bound
    ORDER BY hz.is_hvhz DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE hvhz_zones IS 'High Velocity Hurricane Zones and geographic boundaries for wind analysis';
COMMENT ON COLUMN hvhz_zones.is_hvhz IS 'True if location is in High Velocity Hurricane Zone';
COMMENT ON COLUMN hvhz_zones.north_bound IS 'Northern latitude boundary (degrees)';
COMMENT ON COLUMN hvhz_zones.south_bound IS 'Southern latitude boundary (degrees)';
COMMENT ON COLUMN hvhz_zones.east_bound IS 'Eastern longitude boundary (degrees)';
COMMENT ON COLUMN hvhz_zones.west_bound IS 'Western longitude boundary (degrees)';

-- Test the functions with known coordinates
-- Miami (should be HVHZ): 25.7617, -80.1918
-- Orlando (should not be HVHZ): 28.5383, -81.3792

-- Example queries:
-- SELECT * FROM is_hvhz_location(25.7617, -80.1918); -- Miami - should return HVHZ
-- SELECT * FROM is_hvhz_location(28.5383, -81.3792); -- Orlando - should return non-HVHZ
-- SELECT * FROM get_county_from_coordinates(25.7617, -80.1918); -- Should return Miami-Dade
