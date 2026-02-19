-- Create user_addresses table
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    label TEXT NOT NULL, -- e.g. "Home", "Work"
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    city TEXT,
    state TEXT, -- Wilaya Name
    zip_code TEXT, -- Wilaya Code
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for address
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Policies for addresses
CREATE POLICY "Users can view their own addresses" ON public.user_addresses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses" ON public.user_addresses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses" ON public.user_addresses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses" ON public.user_addresses
    FOR DELETE USING (auth.uid() = user_id);

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percentage')),
    discount_value NUMERIC NOT NULL,
    min_spend NUMERIC DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies for coupons
-- Admins can do everything
CREATE POLICY "Admins can manage coupons" ON public.coupons
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
            OR email IN ('yugo@ibda3d.com', 'admin@ibda3d.com')
        )
    );

-- Public can verify coupons via RPC only, but we might want them to read basic info?
-- Actually, let's keep it restricted and use RPC for validation to hide usage stats etc.
-- But wait, the frontend might need to read it if applying directly?
-- The checkout uses RPC 'validate_coupon'. AdminMarketing uses direct select.

-- Create validate_coupon function
CREATE OR REPLACE FUNCTION validate_coupon(coupon_code TEXT, cart_total NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    coupon_record RECORD;
BEGIN
    -- Find coupon
    SELECT * INTO coupon_record FROM public.coupons 
    WHERE code = UPPER(coupon_code) AND is_active = true;

    IF coupon_record IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Invalid coupon code');
    END IF;

    -- Check expiry
    IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < NOW() THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Coupon expired');
    END IF;

    -- Check usage limit
    IF coupon_record.usage_limit IS NOT NULL AND coupon_record.used_count >= coupon_record.usage_limit THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Coupon usage limit reached');
    END IF;

    -- Check min spend
    IF coupon_record.min_spend > cart_total THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Minimum spend not met (' || coupon_record.min_spend || ' DA)');
    END IF;

    -- Helper to return success
    RETURN jsonb_build_object(
        'valid', true, 
        'discount_type', coupon_record.discount_type,
        'discount_value', coupon_record.discount_value
    );
END;
$$;
