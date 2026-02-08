
-- Shipping companies table
CREATE TABLE public.shipping_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_companies ENABLE ROW LEVEL SECURITY;

-- Anyone can view active shipping companies
CREATE POLICY "Anyone can view active shipping companies"
ON public.shipping_companies
FOR SELECT
USING (is_active = true);

-- Admins/owners can view all
CREATE POLICY "Admins can view all shipping companies"
ON public.shipping_companies
FOR SELECT
USING (is_admin_or_owner(auth.uid()));

-- Admins/owners can manage
CREATE POLICY "Admins can manage shipping companies"
ON public.shipping_companies
FOR ALL
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_shipping_companies_updated_at
BEFORE UPDATE ON public.shipping_companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Shipping rates table (per company per wilaya)
CREATE TABLE public.shipping_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.shipping_companies(id) ON DELETE CASCADE,
  wilaya_code text NOT NULL,
  desk_price numeric NOT NULL DEFAULT 0,
  home_price numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(company_id, wilaya_code)
);

ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Anyone can view shipping rates (needed for checkout)
CREATE POLICY "Anyone can view shipping rates"
ON public.shipping_rates
FOR SELECT
USING (true);

-- Admins/owners can manage
CREATE POLICY "Admins can manage shipping rates"
ON public.shipping_rates
FOR ALL
USING (is_admin_or_owner(auth.uid()))
WITH CHECK (is_admin_or_owner(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_shipping_rates_updated_at
BEFORE UPDATE ON public.shipping_rates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
