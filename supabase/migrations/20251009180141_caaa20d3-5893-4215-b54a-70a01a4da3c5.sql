-- Add currency field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN currency TEXT NOT NULL DEFAULT 'XAF';

-- Add check constraint for valid currencies
ALTER TABLE public.profiles
ADD CONSTRAINT valid_currency CHECK (currency IN ('XAF', 'USD', 'EUR', 'GBP', 'XOF'));