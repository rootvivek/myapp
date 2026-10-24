-- Migration: Add transaction_type to repairs table
-- Supports Buy & Sell transactions directly within repairs

ALTER TABLE public.repairs
  ADD COLUMN IF NOT EXISTS transaction_type text;

-- Add check constraint to restrict values to 'buy', 'sell', or NULL (for standard repairs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.repairs'::regclass
      AND conname = 'repairs_transaction_type_check'
  ) THEN
    ALTER TABLE public.repairs
      ADD CONSTRAINT repairs_transaction_type_check
      CHECK (transaction_type IS NULL OR transaction_type IN ('buy', 'sell'));
  END IF;
END $$;

-- Index to optimize querying and filtering buy/sell entries
CREATE INDEX IF NOT EXISTS repairs_transaction_type_idx
  ON public.repairs (transaction_type)
  WHERE transaction_type IS NOT NULL;

-- Inform PostgREST to refresh its schema cache immediately
NOTIFY pgrst, 'reload schema';
