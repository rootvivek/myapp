-- ═══════════════════════════════════════════════════════════════════
-- Database Migration: 2026-09-28
-- Fixes applied:
--   1. Search function: use sanitized v_safe in ILIKE patterns
--   2. Search function: change security invoker → security definer
--   3. Add missing index on repairs.created_by
--   4. Add missing index on repairs.status (for filtered queries)
-- ═══════════════════════════════════════════════════════════════════

-- ── Fix 1 & 2: Search function ────────────────────────────────────

create or replace function public.search_repairs_for_user(p_query text)
returns setof public.repairs
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_safe text;
begin
  -- Strip SQL wildcards and symbols (#, -, spaces, etc.) to get a clean search string
  v_safe := regexp_replace(trim(coalesce(p_query, '')), '[%_,#\- ]', '', 'g');
  if length(v_safe) = 0 then
    return;
  end if;

  -- Strip 'ord' prefix if user typed 'ord123'
  if v_safe ilike 'ord%' then
    v_safe := substring(v_safe from 4);
  end if;

  return query
    select *
    from public.repairs r
    where r.shop_id = public.get_user_shop_id(auth.uid())
    and (
      r.customer_name ilike '%' || v_safe || '%'
      or r.phone ilike '%' || v_safe || '%'
      or r.imei ilike '%' || v_safe || '%'
      or r.order_code ilike '%' || v_safe || '%'
      or r.id::text = v_safe
      or r.order_code ilike '%' || lpad(v_safe, 5, '0') || '%'
    )
    order by r.date_received desc, r.id desc;
end;
$$;

grant execute on function public.search_repairs_for_user(text) to authenticated;

-- ── Fix 3: Missing index on repairs.created_by ─────────────────────

create index if not exists repairs_created_by_idx on public.repairs (created_by);

-- ── Fix 4: Missing index on repairs.status ─────────────────────────

create index if not exists repairs_status_idx on public.repairs (status);

-- ── Fix 5: Ensure shops.phone column exists ────────────────────────

alter table public.shops add column if not exists phone text not null default '';

-- ── Fix 6: Ensure profiles.username column exists ──────────────────

alter table public.profiles add column if not exists username text;

-- ── Fix 7: Ensure profiles.shop_logo_url column exists ─────────────

alter table public.profiles add column if not exists shop_logo_url text;

-- ── Fix 8: Ensure repairs.user_id column exists ────────────────────

alter table public.repairs add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- ── Fix 9: Ensure inventory.user_id column exists ──────────────────

alter table public.inventory add column if not exists user_id uuid references auth.users (id) on delete cascade;

-- ── Fix 10: Backfill shops.phone from profiles if empty ─────────────

update public.shops s
set phone = btrim(p.phone)
from public.profiles p
where p.id = s.owner_id
  and coalesce(btrim(s.phone), '') = ''
  and coalesce(btrim(p.phone), '') <> '';

-- ── Fix 11: Backfill orphaned repairs with null shop_id ────────────

do $$
declare
  u record;
  v_shop_id uuid;
begin
  for u in
    select au.id, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is not null
  loop
    select s.id into v_shop_id
    from public.shops s
    where s.owner_id = u.id
    order by s.created_at asc, s.id asc
    limit 1;

    if v_shop_id is not null then
      update public.repairs
      set shop_id = v_shop_id, created_by = coalesce(created_by, u.id)
      where user_id = u.id and shop_id is null;

      update public.inventory
      set shop_id = v_shop_id
      where user_id = u.id and shop_id is null;
    end if;
  end loop;
end $$;
