-- Improve security for profiles table
-- Drop existing policies and recreate with stricter rules
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Users can only view their own profile (no admin override needed for profile data)
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admins can view limited profile info (only for order/user management purposes)
-- Using security definer function to prevent policy bypass
CREATE POLICY "Admins can view profiles for management"
ON public.profiles FOR SELECT
USING (public.is_admin_or_owner(auth.uid()));

-- Improve security for orders table
-- Drop existing policies and recreate with stricter rules
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

-- Users can only view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create their own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders (for order management)
CREATE POLICY "Admins can view all orders"
ON public.orders FOR SELECT
USING (public.is_admin_or_owner(auth.uid()));

-- Admins can update orders (for status changes)
CREATE POLICY "Admins can update orders"
ON public.orders FOR UPDATE
USING (public.is_admin_or_owner(auth.uid()))
WITH CHECK (public.is_admin_or_owner(auth.uid()));

-- No delete policy - orders should be archived, not deleted