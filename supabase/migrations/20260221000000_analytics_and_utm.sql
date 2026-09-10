-- Migration: Fix Web Analytics RLS and Add UTM & Event Type Columns
-- Enables reliable Admin Dashboard Analytics & Campaign Attribution

-- 1. Fix RLS on web_analytics for admin access
DROP POLICY IF EXISTS "Enable select for admins" ON public.web_analytics;

CREATE POLICY "Enable select for admins" ON public.web_analytics
    FOR SELECT
    USING (
        public.is_admin_or_owner(auth.uid())
        OR auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
            OR email IN ('yugo@ibda3d.com', 'admin@ibda3d.com')
        )
    );

-- 2. Add event_type & UTM columns to web_analytics
ALTER TABLE public.web_analytics ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'page_view';
ALTER TABLE public.web_analytics ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.web_analytics ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.web_analytics ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.web_analytics ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.web_analytics ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- 3. Add UTM campaign attribution columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- 4. Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_web_analytics_event_type ON public.web_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_web_analytics_session_id ON public.web_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_utm_source ON public.orders(utm_source);
CREATE INDEX IF NOT EXISTS idx_orders_utm_campaign ON public.orders(utm_campaign);
