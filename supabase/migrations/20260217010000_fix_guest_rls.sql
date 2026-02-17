-- Allow anonymous/authenticated users to insert orders
CREATE POLICY "Enable insert for everyone" ON "public"."orders"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);

-- Allow anonymous/authenticated users to insert order items
CREATE POLICY "Enable insert for everyone" ON "public"."order_items"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (true);
