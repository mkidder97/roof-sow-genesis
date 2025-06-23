
-- Create field_inspections table for mobile inspection data collection
CREATE TABLE field_inspections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Inspector Info
    inspector_name VARCHAR(255) NOT NULL,
    inspector_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    inspection_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Project Details
    project_name VARCHAR(255) NOT NULL,
    project_address TEXT NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    
    -- Building Specifications
    building_height REAL,
    building_length REAL,
    building_width REAL,
    square_footage REAL,
    number_of_stories INTEGER DEFAULT 1,
    roof_slope VARCHAR(50), -- 'Flat', 'Low Slope', 'Steep Slope'
    
    -- Existing Roof Assessment
    deck_type VARCHAR(100), -- 'Steel', 'Concrete', 'Wood', 'Composite'
    existing_membrane_type VARCHAR(100), -- 'TPO', 'EPDM', 'PVC', 'BUR', 'Modified'
    existing_membrane_condition INTEGER CHECK (existing_membrane_condition BETWEEN 1 AND 10),
    roof_age_years INTEGER,
    insulation_type VARCHAR(100),
    insulation_condition VARCHAR(50), -- 'Good', 'Fair', 'Poor'
    
    -- Equipment & Features (JSONB for flexibility)
    hvac_units JSONB DEFAULT '[]', -- [{type: 'RTU', count: 3, condition: 'Good'}]
    roof_drains JSONB DEFAULT '[]', -- [{type: 'Interior', count: 8, condition: 'Good'}]
    penetrations JSONB DEFAULT '[]', -- [{type: 'Plumbing Vent', count: 12}]
    skylights INTEGER DEFAULT 0,
    roof_hatches INTEGER DEFAULT 0,
    
    -- Assessment
    overall_condition INTEGER CHECK (overall_condition BETWEEN 1 AND 10),
    priority_level VARCHAR(50) DEFAULT 'Standard', -- 'Standard', 'Expedited', 'Emergency'
    special_requirements TEXT,
    weather_conditions VARCHAR(255),
    
    -- Media & Documentation
    photos TEXT[], -- Array of Supabase Storage URLs
    notes TEXT,
    
    -- Workflow Status
    status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Completed', 'Under Review', 'Approved'
    sow_generated BOOLEAN DEFAULT FALSE,
    sow_id UUID, -- Links to generated SOW
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE field_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own inspections" ON field_inspections
    FOR SELECT USING (auth.uid() = inspector_id);

CREATE POLICY "Users can insert their own inspections" ON field_inspections
    FOR INSERT WITH CHECK (auth.uid() = inspector_id);

CREATE POLICY "Users can update their own inspections" ON field_inspections
    FOR UPDATE USING (auth.uid() = inspector_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_field_inspections_updated_at 
    BEFORE UPDATE ON field_inspections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('inspection-photos', 'inspection-photos', true);

-- Create storage policies for inspection photos
CREATE POLICY "Users can upload their own inspection photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'inspection-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own inspection photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'inspection-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own inspection photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'inspection-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own inspection photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'inspection-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
