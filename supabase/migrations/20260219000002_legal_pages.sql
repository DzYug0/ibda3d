-- Create legal_pages table
CREATE TABLE IF NOT EXISTS public.legal_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML or Markdown
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view active legal pages" ON public.legal_pages
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage legal pages" ON public.legal_pages
    USING (
        auth.uid() IN (
            SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
            OR email IN ('yugo@ibda3d.com', 'admin@ibda3d.com')
        )
    );

-- Seed defaults
INSERT INTO public.legal_pages (slug, title, content)
VALUES 
('privacy', 'Privacy Policy', '<h1>Privacy Policy</h1><p>At Ibda3D, we value your privacy. This policy outlines how we collect, use, and protect your data.</p><h2>1. Information We Collect</h2><p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us.</p><h2>2. How We Use Your Information</h2><p>We use your information to process transactions, send you updates, and improve our services.</p>'),
('terms', 'Terms of Service', '<h1>Terms of Service</h1><p>Welcome to Ibda3D. By using our website, you agree to these terms.</p><h2>1. User Accounts</h2><p>You are responsible for maintaining the confidentiality of your account credentials.</p><h2>2. Purchases</h2><p>All purchases are subject to availability and our return policy.</p>')
ON CONFLICT (slug) DO NOTHING;
