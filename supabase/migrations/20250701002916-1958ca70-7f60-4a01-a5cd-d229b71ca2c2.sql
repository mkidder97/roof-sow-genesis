
-- Create gcp_config table for storing GCₚ values
CREATE TABLE public.gcp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roof_type TEXT NOT NULL,
  zone TEXT NOT NULL,
  gc_p_value NUMERIC NOT NULL CHECK (gc_p_value > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique combination of roof_type and zone
  CONSTRAINT unique_roof_type_zone UNIQUE(roof_type, zone)
);

-- Add Row Level Security (RLS)
ALTER TABLE public.gcp_config ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is configuration data)
CREATE POLICY "Allow public read access to gcp_config" 
  ON public.gcp_config 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert gcp_config" 
  ON public.gcp_config 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update gcp_config" 
  ON public.gcp_config 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete gcp_config" 
  ON public.gcp_config 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER update_gcp_config_updated_at 
  BEFORE UPDATE ON public.gcp_config 
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

-- Add some sample data
INSERT INTO public.gcp_config (roof_type, zone, gc_p_value) VALUES
('low_slope', 'field', 0.18),
('low_slope', 'perimeter', 0.27),
('low_slope', 'corner', 0.35),
('steep_slope', 'field', 0.25),
('steep_slope', 'perimeter', 0.40),
('steep_slope', 'corner', 0.55);
