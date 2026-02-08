
-- Create packs table
CREATE TABLE public.packs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price NUMERIC NOT NULL,
  compare_at_price NUMERIC,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pack_items junction table
CREATE TABLE public.pack_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pack_id UUID NOT NULL REFERENCES public.packs(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pack_id, product_id)
);

-- Enable RLS
ALTER TABLE public.packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pack_items ENABLE ROW LEVEL SECURITY;

-- Packs policies
CREATE POLICY "Anyone can view active packs" ON public.packs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can view all packs" ON public.packs FOR SELECT USING (is_admin_or_owner(auth.uid()));
CREATE POLICY "Admins can manage packs" ON public.packs FOR ALL USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

-- Pack items policies
CREATE POLICY "Anyone can view pack items" ON public.pack_items FOR SELECT USING (true);
CREATE POLICY "Admins can manage pack items" ON public.pack_items FOR ALL USING (is_admin_or_owner(auth.uid())) WITH CHECK (is_admin_or_owner(auth.uid()));

-- Indexes
CREATE INDEX idx_pack_items_pack_id ON public.pack_items(pack_id);
CREATE INDEX idx_pack_items_product_id ON public.pack_items(product_id);

-- Updated at trigger
CREATE TRIGGER update_packs_updated_at BEFORE UPDATE ON public.packs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
