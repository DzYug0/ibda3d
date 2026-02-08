
-- Add logo_url column to shipping_companies
ALTER TABLE public.shipping_companies ADD COLUMN logo_url text;

-- Create storage bucket for shipping logos
INSERT INTO storage.buckets (id, name, public) VALUES ('shipping-logos', 'shipping-logos', true);

-- Public read access
CREATE POLICY "Anyone can view shipping logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'shipping-logos');

-- Admin/owner upload access
CREATE POLICY "Admins can upload shipping logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'shipping-logos' AND is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can update shipping logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'shipping-logos' AND is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins can delete shipping logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'shipping-logos' AND is_admin_or_owner(auth.uid()));
