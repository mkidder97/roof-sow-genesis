-- Engineering Configuration Table
-- Stores all engineering constants and configuration values as JSON

CREATE TABLE engineering_config (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE engineering_config ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to engineering_config" ON engineering_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow full access to service role
CREATE POLICY "Allow full access to service role" ON engineering_config
    FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_engineering_config_key ON engineering_config(key);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_engineering_config_updated_at 
    BEFORE UPDATE ON engineering_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial configuration values
INSERT INTO engineering_config (key, value, description) VALUES 
(
    'importance_factors',
    '{"standard": 1.0, "essential": 1.15, "emergency": 1.5}',
    'Importance factors (I) for different building classifications per ASCE 7'
),
(
    'internal_pressure_coeffs',
    '{"enclosed": 0.18, "partially_enclosed": 0.55, "open": 0.0}',
    'Internal pressure coefficients (GCpi) for different building enclosure classifications'
),
(
    'directivity_factor',
    '{"standard": 0.85}',
    'Wind directionality factor (Kd) per ASCE 7'
),
(
    'template_rules',
    '[
        {
            "condition": {
                "roofType": "tearoff",
                "deckType": "steel",
                "membraneType": "TPO",
                "attachmentType": "mechanically_attached",
                "hasInsulation": true
            },
            "template": "T6-Tearoff-TPO(MA)-insul-steel",
            "description": "Tearoff TPO mechanically attached with insulation over steel deck"
        },
        {
            "condition": {
                "roofType": "tearoff",
                "deckType": "steel",
                "membraneType": "TPO",
                "attachmentType": "mechanically_attached",
                "hasInsulation": true,
                "hasLightweightConcrete": true
            },
            "template": "T7-Tearoff-TPO(MA)-insul-lwc-steel",
            "description": "Tearoff TPO mechanically attached with insulation over lightweight concrete and steel"
        },
        {
            "condition": {
                "roofType": "tearoff",
                "deckType": "gypsum",
                "membraneType": "TPO",
                "attachmentType": "adhered",
                "hasInsulation": true,
                "insulationAttachment": "adhered"
            },
            "template": "T8-Tearoff-TPO(adhered)-insul(adhered)-gypsum",
            "description": "Tearoff TPO fully adhered with adhered insulation over gypsum deck"
        },
        {
            "condition": {
                "roofType": "recover",
                "deckType": "steel",
                "membraneType": "TPO",
                "attachmentType": "mechanically_attached",
                "hasCoverBoard": true,
                "existingSystem": "BUR",
                "hasInsulation": true
            },
            "template": "T1-Recover-TPO(MA)-cvr bd-BUR-insul-steel",
            "description": "Recover TPO mechanically attached with cover board over BUR with insulation on steel"
        },
        {
            "condition": {
                "roofType": "recover",
                "deckType": "steel",
                "membraneType": "TPO",
                "attachmentType": "mechanically_attached",
                "hasCoverBoard": true,
                "existingSystem": "BUR",
                "hasLightweightConcrete": true
            },
            "template": "T2-Recover-TPO(MA)-cvr bd-BUR-lwc-steel",
            "description": "Recover TPO mechanically attached with cover board over BUR with lightweight concrete on steel"
        },
        {
            "condition": {
                "roofType": "recover",
                "deckType": "steel",
                "membraneType": "TPO",
                "attachmentType": "mechanically_attached",
                "membraneStyle": "fleeceback",
                "existingSystem": "BUR",
                "hasInsulation": true
            },
            "template": "T3-Recover-TPOfleece(MA)-BUR-insul-steel",
            "description": "Recover fleeceback TPO mechanically attached over BUR with insulation on steel"
        },
        {
            "condition": {
                "roofType": "recover",
                "deckType": "steel",
                "membraneStyle": "fleeceback",
                "membraneType": "TPO",
                "attachmentType": "mechanically_attached",
                "existingSystem": "BUR",
                "hasLightweightConcrete": true
            },
            "template": "T4-Recover-TPOfleece(MA)-BUR-lwc-steel",
            "description": "Recover fleeceback TPO mechanically attached over BUR with lightweight concrete on steel"
        },
        {
            "condition": {
                "roofType": "recover",
                "deckType": "SSR",
                "membraneType": "TPO",
                "attachmentType": "mechanically_attached",
                "membraneStyle": "rhino",
                "hasInsulation": true,
                "insulationType": "EPS_flute_fill"
            },
            "template": "T5-Recover-TPO(Rhino)-iso-EPS flute fill-SSR",
            "description": "Recover Rhino TPO mechanically attached with EPS flute fill insulation over structural standing seam"
        }
    ]',
    'Template selection rules based on project conditions'
),
(
    'wind_exposure_coeffs',
    '{"B": 0.7, "C": 0.85, "D": 1.0}',
    'Wind exposure category coefficients for basic wind speed adjustments'
),
(
    'topographic_factor',
    '{"default": 1.0, "hilltop": 1.3, "ridge": 1.15, "escarpment": 1.2}',
    'Topographic factor (Kzt) values for different terrain features'
),
(
    'attachment_zones',
    '{
        "field": {"description": "Interior field of roof", "factor": 1.0},
        "perimeter": {"description": "Perimeter zone within 10% of roof dimension from edge", "factor": 1.4},
        "corner": {"description": "Corner zones at roof intersections", "factor": 2.0}
    }',
    'Roof attachment zone definitions and pressure multiplication factors'
),
(
    'membrane_specifications',
    '{
        "TPO": {
            "standard_thickness": "60-mil",
            "alternate_thickness": "80-mil",
            "lap_width": "6 inches",
            "weld_width": "1.5 inches",
            "seam_requirements": "probed daily and initialed",
            "cover_strip_thickness": "60-mil"
        }
    }',
    'Membrane specifications and installation requirements'
);

-- Create view for active configurations
CREATE VIEW active_engineering_config AS
SELECT key, value, description, updated_at
FROM engineering_config
ORDER BY key;

COMMENT ON TABLE engineering_config IS 'Stores engineering constants and configuration values as JSON for dynamic system behavior';
COMMENT ON VIEW active_engineering_config IS 'Active engineering configurations for application use';
