-- Lead Hunter Storage Configuration
-- Run this in Supabase SQL Editor

-- Create storage bucket for lead images
INSERT INTO storage.buckets (id, name, public)
VALUES ('lead-images', 'lead-images', false);

-- Storage policies for lead-images bucket
-- Allow authenticated users to upload images
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'lead-images');

-- Allow authenticated users to read images
CREATE POLICY "Allow authenticated reads"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'lead-images');

-- Allow service role to do everything (for scraper)
CREATE POLICY "Allow service role all operations"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'lead-images');

-- Allow public read access (optional - uncomment if you want images publicly accessible)
-- CREATE POLICY "Allow public reads"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'lead-images');
