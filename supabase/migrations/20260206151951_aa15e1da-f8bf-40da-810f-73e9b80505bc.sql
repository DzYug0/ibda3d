
-- Drop existing restrictive policies on user_roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Recreate with owner support
CREATE POLICY "Admins and owners can view all roles"
ON public.user_roles
FOR SELECT
USING (is_admin_or_owner(auth.uid()));

CREATE POLICY "Admins and owners can manage roles"
ON public.user_roles
FOR ALL
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));
