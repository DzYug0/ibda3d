-- Fix storage policies for product-images to include owner role
DROP POLICY "Admins can upload product images" ON storage.objects;
CREATE POLICY "Admins and owners can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND is_admin_or_owner(auth.uid()));

DROP POLICY "Admins can update product images" ON storage.objects;
CREATE POLICY "Admins and owners can update product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND is_admin_or_owner(auth.uid()));

DROP POLICY "Admins can delete product images" ON storage.objects;
CREATE POLICY "Admins and owners can delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND is_admin_or_owner(auth.uid()));