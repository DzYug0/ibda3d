-- Allow orders with null user_id (guest orders)
-- Drop and recreate the insert policy to allow guest orders
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (true);
