-- Sellers are created first because repairs.seller_id references this table.
create table if not exists public.sellers (
  id bigserial primary key,
  seller_name text not null default '',
  phone text not null default '',
  user_id uuid references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fill in columns if a partially-created sellers table already existed.
alter table public.sellers
  add column if not exists seller_name text not null default '',
  add column if not exists phone text not null default '',
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists shop_id uuid references public.shops (id) on delete set null,
  add column if not exists created_by uuid references auth.users (id) on delete set null,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists sellers_user_id_idx on public.sellers (user_id);
create index if not exists sellers_shop_id_idx on public.sellers (shop_id);

-- Keep seller-name uniqueness in line with the original seller migration.
create unique index if not exists sellers_shop_name_unique
  on public.sellers (shop_id, lower(seller_name))
  where shop_id is not null;
create unique index if not exists sellers_user_name_unique
  on public.sellers (user_id, lower(seller_name))
  where shop_id is null;

-- Older inserts wrote created_by as the authenticated user, so it is a safe
-- source for recovering missing seller ownership too.
update public.sellers
set user_id = created_by
where user_id is null
  and created_by is not null;

alter table public.sellers enable row level security;

drop policy if exists "sellers_select_policy" on public.sellers;
create policy "sellers_select_policy" on public.sellers
  for select using (
    user_id = auth.uid()
    or shop_id in (select p.shop_id from public.profiles p where p.id = auth.uid())
    or shop_id in (select s.id from public.shops s where s.owner_id = auth.uid())
  );

drop policy if exists "sellers_insert_policy" on public.sellers;
create policy "sellers_insert_policy" on public.sellers
  for insert with check (
    created_by = auth.uid()
    and user_id = auth.uid()
  );

drop policy if exists "sellers_update_policy" on public.sellers;
create policy "sellers_update_policy" on public.sellers
  for update using (
    user_id = auth.uid()
    or shop_id in (select s.id from public.shops s where s.owner_id = auth.uid())
  );

-- Add missing repair fields. user_id stays nullable for historical rows for
-- which the original owner cannot be determined reliably.
alter table public.repairs
  add column if not exists order_code text not null default '',
  add column if not exists user_id uuid references auth.users (id) on delete cascade,
  add column if not exists seller_id bigint;

-- Add the seller FK even if seller_id existed already without its constraint.
-- Drop only dangling references; those cannot be restored to a seller record.
update public.repairs r
set seller_id = null
where seller_id is not null
  and not exists (select 1 from public.sellers s where s.id = r.seller_id);

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    where c.conrelid = 'public.repairs'::regclass
      and c.conname = 'repairs_seller_id_fkey'
  ) then
    alter table public.repairs
      add constraint repairs_seller_id_fkey
      foreign key (seller_id) references public.sellers(id) on delete set null;
  end if;
end $$;

create index if not exists repairs_seller_id_idx on public.repairs (seller_id);
create index if not exists repairs_user_id_idx on public.repairs (user_id);

-- Guarantee every newly inserted repair receives its deterministic order code,
-- including inserts from clients that do not run the follow-up app update.
create or replace function public.set_repair_order_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if coalesce(btrim(new.order_code), '') = '' and new.id is not null then
    new.order_code := 'ord' || case
      when new.id <= 99999 then lpad(new.id::text, 5, '0')
      else new.id::text
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists set_repair_order_code_trigger on public.repairs;
create trigger set_repair_order_code_trigger
  before insert or update on public.repairs
  for each row
  execute function public.set_repair_order_code();
revoke execute on function public.set_repair_order_code() from public, anon, authenticated;

-- Existing app inserts set created_by to the authenticated user's ID, so it
-- is a reliable source for restoring user_id. Do not guess for remaining rows.
update public.repairs
set user_id = created_by
where user_id is null
  and created_by is not null;

-- The order code is deterministic from the repair primary key, matching the
-- app's orderCodeFromRepairId() format (ord00001, ord00002, ...).
update public.repairs
set order_code = 'ord' || case
  when id <= 99999 then lpad(id::text, 5, '0')
  else id::text
end
`where coalesce(btrim(order_code), '') = '';
`