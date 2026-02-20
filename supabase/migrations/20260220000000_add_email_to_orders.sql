-- Add email column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email text;

-- Add a comment to the column
COMMENT ON COLUMN public.orders.email IS 'The email address to send order updates to, collected during checkout.';
