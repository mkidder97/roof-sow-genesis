
-- Extend existing field_inspections table
ALTER TABLE field_inspections 
ADD COLUMN IF NOT EXISTS sow_generated BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sow_generation_count INTEGER DEFAULT 0;

-- Create sow_generations table for tracking all SOW generation attempts
CREATE TABLE IF NOT EXISTS sow_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES field_inspections(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_type VARCHAR(50) NOT NULL,
  generation_status VARCHAR(20) DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  input_data JSONB NOT NULL,
  output_file_path VARCHAR(500),
  file_size_bytes BIGINT,
  generation_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generation_completed_at TIMESTAMP WITH TIME ZONE,
  generation_duration_seconds INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sow_templates table for template management
CREATE TABLE IF NOT EXISTS sow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sow_generations_inspection_id ON sow_generations(inspection_id);
CREATE INDEX IF NOT EXISTS idx_sow_generations_user_id ON sow_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_sow_generations_status ON sow_generations(generation_status);
CREATE INDEX IF NOT EXISTS idx_sow_generations_created_at ON sow_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_sow_templates_type_active ON sow_templates(template_type, is_active);

-- Enable Row Level Security
ALTER TABLE sow_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sow_generations (users can only see their own generations)
CREATE POLICY "Users can view their own SOW generations" ON sow_generations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SOW generations" ON sow_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOW generations" ON sow_generations
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sow_templates (read-only for active templates)
CREATE POLICY "Anyone can view active SOW templates" ON sow_templates
  FOR SELECT USING (is_active = true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sow_generation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_sow_generations_updated_at
  BEFORE UPDATE ON sow_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_sow_generation_updated_at();

-- Insert some default templates
INSERT INTO sow_templates (name, template_type, version, template_data) VALUES
('Standard Commercial Roof', 'commercial', '1.0', '{"sections": ["project_overview", "scope_of_work", "materials", "installation", "warranty"]}'),
('Residential Roof Basic', 'residential', '1.0', '{"sections": ["project_overview", "scope_of_work", "materials", "installation"]}'),
('Industrial Roof Complex', 'industrial', '1.0', '{"sections": ["project_overview", "scope_of_work", "materials", "installation", "safety", "warranty"]}')
ON CONFLICT DO NOTHING;
