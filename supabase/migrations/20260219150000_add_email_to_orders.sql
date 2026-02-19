ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS email text;

-- Add index for email searches
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
