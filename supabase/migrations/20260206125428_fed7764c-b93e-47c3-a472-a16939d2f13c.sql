
-- Drop the existing restrictive policy
DROP POLICY "Admins can manage categories" ON public.categories;

-- Recreate it to include owners
CREATE POLICY "Admins and owners can manage categories"
ON public.categories
FOR ALL
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));
