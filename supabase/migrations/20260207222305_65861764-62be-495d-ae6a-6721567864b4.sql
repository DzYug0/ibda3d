
-- Add is_banned column to profiles
ALTER TABLE public.profiles ADD COLUMN is_banned boolean NOT NULL DEFAULT false;

-- Add banned_at timestamp
ALTER TABLE public.profiles ADD COLUMN banned_at timestamp with time zone;
