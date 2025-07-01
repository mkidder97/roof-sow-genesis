
-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_gcp_config_updated_at ON public.gcp_config;

-- Create the trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_gcp_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
CREATE TRIGGER update_gcp_config_updated_at
  BEFORE UPDATE ON public.gcp_config
  FOR EACH ROW EXECUTE FUNCTION update_gcp_config_updated_at();
