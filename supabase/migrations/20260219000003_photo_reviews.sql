-- Add image_urls column to reviews table
ALTER TABLE public.reviews
ADD COLUMN image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create a new storage bucket for review images
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Give public read access to review images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'review-images' );

-- Policy: Allow authenticated users to upload review images
CREATE POLICY "Authenticated users can upload review images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'review-images' );

-- Policy: Allow users to delete their own review images (optional but good for cleanup)
CREATE POLICY "Users can delete their own review images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'review-images' AND owner = auth.uid() );
