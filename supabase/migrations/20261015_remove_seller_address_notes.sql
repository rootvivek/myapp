-- Seller addresses and notes are no longer collected or used by the app.
-- Existing values in these columns will be permanently removed.
ALTER TABLE public.sellers
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS notes;