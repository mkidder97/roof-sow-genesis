-- SOW Generations Table
-- Tracks all SOW generation requests and their status

CREATE TABLE IF NOT EXISTS sow_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Project Information
  project_name TEXT NOT NULL,
  project_address TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  
  -- Generation Status
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'failed')),
  error_message TEXT,
  
  -- Request Data
  request_data JSONB NOT NULL, -- Store the original request data
  inspection_id UUID REFERENCES field_inspections(id),
  
  -- File Processing
  file_uploaded BOOLEAN DEFAULT FALSE,
  file_name TEXT,
  extraction_confidence REAL, -- 0.0 to 1.0
  
  -- Generated Content
  pdf_url TEXT,
  pdf_data TEXT, -- Base64 encoded PDF for download endpoint
  engineering_summary JSONB,
  template_used TEXT,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  generation_time_ms INTEGER,
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add RLS (Row Level Security)
ALTER TABLE sow_generations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own SOW generations
CREATE POLICY "Users can view own sow_generations" ON sow_generations
  FOR SELECT USING (auth.uid() = created_by);

-- Policy: Users can insert their own SOW generations
CREATE POLICY "Users can insert own sow_generations" ON sow_generations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update their own SOW generations
CREATE POLICY "Users can update own sow_generations" ON sow_generations
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Users can delete their own SOW generations
CREATE POLICY "Users can delete own sow_generations" ON sow_generations
  FOR DELETE USING (auth.uid() = created_by);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sow_generations_created_by ON sow_generations(created_by);
CREATE INDEX IF NOT EXISTS idx_sow_generations_status ON sow_generations(status);
CREATE INDEX IF NOT EXISTS idx_sow_generations_created_at ON sow_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sow_generations_inspection_id ON sow_generations(inspection_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sow_generations_updated_at 
  BEFORE UPDATE ON sow_generations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key to field_inspections for SOW generation tracking
ALTER TABLE field_inspections 
ADD COLUMN IF NOT EXISTS sow_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sow_generation_id UUID REFERENCES sow_generations(id);

-- Add index for field inspection SOW tracking
CREATE INDEX IF NOT EXISTS idx_field_inspections_sow_generated ON field_inspections(sow_generated);
CREATE INDEX IF NOT EXISTS idx_field_inspections_sow_generation_id ON field_inspections(sow_generation_id);

-- Add comments for documentation
COMMENT ON TABLE sow_generations IS 'Tracks SOW generation requests and their completion status';
COMMENT ON COLUMN sow_generations.status IS 'Current status: processing, complete, or failed';
COMMENT ON COLUMN sow_generations.request_data IS 'Original request payload as JSONB';
COMMENT ON COLUMN sow_generations.extraction_confidence IS 'Confidence level of file data extraction (0.0-1.0)';
COMMENT ON COLUMN sow_generations.pdf_data IS 'Base64 encoded PDF for serving via download endpoint';
COMMENT ON COLUMN sow_generations.engineering_summary IS 'Complete engineering analysis summary';
