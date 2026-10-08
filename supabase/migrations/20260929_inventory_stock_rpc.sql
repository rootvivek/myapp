-- ═══════════════════════════════════════════════════════════════════
-- Database Migration: 2026-09-29 — atomic inventory stock deduction
--
-- The client previously read `stock_count` and wrote it back in two
-- requests. Two repairs saving at the same time could both read the
-- same value and one deduction was lost. The write also lacked a
-- shop/user scope, so any permitted id could be decremented.
--
-- This function performs the decrement in a single, scoped statement.
-- ═══════════════════════════════════════════════════════════════════

create or replace function public.deduct_inventory_stock(p_item_id bigint, p_quantity integer default 1)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop_id uuid := public.get_user_shop_id(auth.uid());
  v_new_stock integer;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  update public.inventory i
  set stock_count = greatest(0, i.stock_count - p_quantity),
      updated_at = now()
  where i.id = p_item_id
    and (
      i.user_id = auth.uid()
      or (v_shop_id is not null and i.shop_id = v_shop_id)
    )
  returning i.stock_count into v_new_stock;

  return v_new_stock;
end;
$$;

grant execute on function public.deduct_inventory_stock(bigint, integer) to authenticated;
