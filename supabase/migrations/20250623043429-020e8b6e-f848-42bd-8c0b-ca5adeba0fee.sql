
-- Add missing columns to field_inspections table
ALTER TABLE field_inspections 
ADD COLUMN IF NOT EXISTS skylights_detailed jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS curbs_above_8 boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gas_line_penetrating_deck boolean DEFAULT false;

-- Enable Row Level Security on field_inspections table (if not already enabled)
ALTER TABLE field_inspections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them with correct casting
DROP POLICY IF EXISTS "Users can view their own inspections" ON field_inspections;
DROP POLICY IF EXISTS "Users can insert their own inspections" ON field_inspections;
DROP POLICY IF EXISTS "Users can update their own inspections" ON field_inspections;
DROP POLICY IF EXISTS "Users can delete their own inspections" ON field_inspections;

-- Create RLS policies for field_inspections with proper type casting
CREATE POLICY "Users can view their own inspections" ON field_inspections
  FOR SELECT USING (auth.uid() = inspector_id::uuid);

CREATE POLICY "Users can insert their own inspections" ON field_inspections
  FOR INSERT WITH CHECK (auth.uid() = inspector_id::uuid);

CREATE POLICY "Users can update their own inspections" ON field_inspections
  FOR UPDATE USING (auth.uid() = inspector_id::uuid);

CREATE POLICY "Users can delete their own inspections" ON field_inspections
  FOR DELETE USING (auth.uid() = inspector_id::uuid);

-- Update storage policies for inspection-photos bucket
DROP POLICY IF EXISTS "Users can view inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own inspection photos" ON storage.objects;

-- Create updated storage policies
CREATE POLICY "Users can view inspection photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'inspection-photos');

CREATE POLICY "Authenticated users can upload inspection photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'inspection-photos' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own inspection photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'inspection-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own inspection photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'inspection-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
