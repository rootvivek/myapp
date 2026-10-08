-- ═══════════════════════════════════════════════════════════════════
-- Database Migration: 2026-09-29
-- Security fix:
--   Inventory RLS allowed any authenticated user *without a shop* to
--   read and write every shop's inventory rows.
--
--   The old policies were:
--     using (
--       public.get_user_shop_id(auth.uid()) is null
--       or shop_id = public.get_user_shop_id(auth.uid())
--     )
--
--   For a logged-in user whose profile has no shop_id, the first branch
--   is true, so the policy matched every row in the table.
--
--   The new policies mirror the client's scope rule exactly:
--     * rows owned personally   -> user_id = auth.uid()
--     * rows owned by the shop  -> shop_id = get_user_shop_id(auth.uid())
--
--   This is strictly a narrowing of access: rows that were reachable
--   through the null-shop branch (i.e. other tenants' rows) are no longer
--   visible, while every row the app legitimately queries stays reachable.
-- ═══════════════════════════════════════════════════════════════════

drop policy if exists "inventory_select_shop" on public.inventory;
create policy "inventory_select_shop" on public.inventory
  for select using (
    user_id = auth.uid()
    or (
      shop_id is not null
      and shop_id = public.get_user_shop_id(auth.uid())
    )
  );

drop policy if exists "inventory_insert_shop" on public.inventory;
create policy "inventory_insert_shop" on public.inventory
  for insert with check (
    user_id = auth.uid()
    and (
      shop_id is null
      or shop_id = public.get_user_shop_id(auth.uid())
    )
  );

drop policy if exists "inventory_update_shop" on public.inventory;
create policy "inventory_update_shop" on public.inventory
  for update using (
    user_id = auth.uid()
    or (
      shop_id is not null
      and shop_id = public.get_user_shop_id(auth.uid())
    )
  );

drop policy if exists "inventory_delete_shop" on public.inventory;
create policy "inventory_delete_shop" on public.inventory
  for delete using (
    user_id = auth.uid()
    or (
      shop_id is not null
      and shop_id = public.get_user_shop_id(auth.uid())
    )
  );

-- ── Backfill: give legacy rows an owner so they are not orphaned ────
-- Rows created before inventory.user_id existed have user_id = null.
-- When the row belongs to a shop, use the owner's id; this keeps the
-- personal scope (user_id = auth.uid()) working for the owner.
update public.inventory i
set user_id = s.owner_id
from public.shops s
where i.user_id is null
  and i.shop_id = s.id;
