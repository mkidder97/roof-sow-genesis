
-- Create storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspection-photos', 'inspection-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for inspection photos bucket
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
