
-- Drop existing product policies that only check 'admin' role
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

-- Recreate with is_admin_or_owner for consistency
CREATE POLICY "Admins and owners can view all products"
ON public.products
FOR SELECT
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins and owners can manage products"
ON public.products
FOR ALL
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));
