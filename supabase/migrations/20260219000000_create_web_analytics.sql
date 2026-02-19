-- Create web_analytics table
CREATE TABLE IF NOT EXISTS public.web_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    page_path TEXT NOT NULL,
    visitor_id TEXT, -- Anonymous ID from localStorage
    session_id TEXT, -- Session ID
    user_id UUID REFERENCES auth.users(id),
    device_type TEXT,
    referrer TEXT,
    country TEXT,
    meta JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.web_analytics ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Allow anon users to insert (track themselves)
CREATE POLICY "Enable insert for all users" ON public.web_analytics
    FOR INSERT
    WITH CHECK (true);

-- 2. Allow admins to select all
CREATE POLICY "Enable select for admins" ON public.web_analytics
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
            OR email IN ('yugo@ibda3d.com', 'admin@ibda3d.com') -- Hardcoded fallback just in case
        )
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_analytics_created_at ON public.web_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_web_analytics_page_path ON public.web_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_web_analytics_visitor_id ON public.web_analytics(visitor_id);
