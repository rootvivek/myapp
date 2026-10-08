`-- ============================================================
-- Seller Feature Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor).
-- Safe to run multiple times (uses IF NOT EXISTS / DO blocks).
-- ============================================================

-- 1. Create the sellers table
CREATE TABLE IF NOT EXISTS public.sellers (
  id           BIGSERIAL PRIMARY KEY,
  seller_name  TEXT        NOT NULL,
  phone        TEXT        NOT NULL DEFAULT '',
  address      TEXT        NOT NULL DEFAULT '',
  notes        TEXT        NOT NULL DEFAULT '',
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id      UUID        REFERENCES public.shops(id) ON DELETE SET NULL,
  created_by   UUID        NOT NULL REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Unique constraint: case-insensitive seller name per shop/user
--    Prevents "ABC Mobile" and "abc mobile" coexisting for the same shop.
DO $$
BEGIN
  -- Per-shop unique constraint (when shop_id is set)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sellers_shop_name_unique'
  ) THEN
    CREATE UNIQUE INDEX sellers_shop_name_unique
      ON public.sellers (shop_id, lower(seller_name))
      WHERE shop_id IS NOT NULL;
  END IF;

  -- Per-user unique constraint (when no shop)
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sellers_user_name_unique'
  ) THEN
    CREATE UNIQUE INDEX sellers_user_name_unique
      ON public.sellers (user_id, lower(seller_name))
      WHERE shop_id IS NULL;
  END IF;
END $$;

-- 3. Index for fast lookup by shop/user
CREATE INDEX IF NOT EXISTS sellers_shop_id_idx  ON public.sellers (shop_id);
CREATE INDEX IF NOT EXISTS sellers_user_id_idx  ON public.sellers (user_id);

-- 4. Add seller_id FK column to repairs table
ALTER TABLE public.repairs
  ADD COLUMN IF NOT EXISTS seller_id BIGINT REFERENCES public.sellers(id) ON DELETE SET NULL;

-- 5. Index on repairs.seller_id for efficient joins
CREATE INDEX IF NOT EXISTS repairs_seller_id_idx ON public.repairs (seller_id);

-- ============================================================
-- 6. Row Level Security (RLS) on sellers table
-- ============================================================
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

-- Policy: users can read their own shop's sellers OR their own personal sellers
DROP POLICY IF EXISTS "sellers_select_policy" ON public.sellers;
CREATE POLICY "sellers_select_policy" ON public.sellers
  FOR SELECT USING (
    user_id = auth.uid()
    OR shop_id IN (
      SELECT shop_id FROM public.profiles WHERE id = auth.uid()
    )
    OR shop_id IN (
      SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
  );

-- Policy: authenticated users can insert sellers for their own user/shop
DROP POLICY IF EXISTS "sellers_insert_policy" ON public.sellers;
CREATE POLICY "sellers_insert_policy" ON public.sellers
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND user_id = auth.uid()
  );

-- Policy: creator or shop owner can update
DROP POLICY IF EXISTS "sellers_update_policy" ON public.sellers;
CREATE POLICY "sellers_update_policy" ON public.sellers
  FOR UPDATE USING (
    user_id = auth.uid()
    OR shop_id IN (
      SELECT id FROM public.shops WHERE owner_id = auth.uid()
    )
  );

-- NOTE: DELETE is intentionally NOT allowed via app.
-- Sellers referenced by repairs use ON DELETE SET NULL (safe degradation).
-- If deletion is needed in future, add a soft-delete `is_active` column.

-- ============================================================
-- DONE
-- ============================================================
