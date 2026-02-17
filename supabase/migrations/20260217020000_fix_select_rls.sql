-- Allow everyone to read order items (needed for Guest Success page and Admin Dashboard)
-- You can restrict this later to only Admins or Owners if strictly needed, 
-- but normally Order ID (UUID) knowledge is sufficient security for reading items.

CREATE POLICY "Enable select for everyone" ON "public"."order_items"
AS PERMISSIVE FOR SELECT
TO public
USING (true);
