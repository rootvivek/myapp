-- Run this in the Supabase SQL Editor (Dashboard → SQL) after creating a project.
-- 1. Create tables & policies
-- 2. Storage: create bucket "repair-images" (public) — or use private bucket + signed URLs (adjust app if needed)

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ══════════════════════════════════════════════════════
-- Helper functions to prevent RLS infinite recursion
-- ══════════════════════════════════════════════════════
create or replace function public.get_user_shop_id(p_user_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select shop_id from public.profiles where id = p_user_id;
$$;

create or replace function public.get_user_role(p_user_id uuid)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = p_user_id;
$$;

grant execute on function public.get_user_shop_id(uuid) to authenticated;
grant execute on function public.get_user_role(uuid) to authenticated;

-- ══════════════════════════════════════════════════════
-- Shops table
-- ══════════════════════════════════════════════════════
create table if not exists public.shops (
  id uuid primary key default uuid_generate_v4(),
  shop_name text not null default '',
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.shops enable row level security;

drop policy if exists "shops_select_member" on public.shops;
create policy "shops_select_member" on public.shops
  for select using (
    id = public.get_user_shop_id(auth.uid())
  );

drop policy if exists "shops_select_owner" on public.shops;
create policy "shops_select_owner" on public.shops
  for select using (
    owner_id = auth.uid()
  );

drop policy if exists "shops_insert_owner" on public.shops;
create policy "shops_insert_owner" on public.shops
  for insert with check (owner_id = auth.uid());

drop policy if exists "shops_update_owner" on public.shops;
create policy "shops_update_owner" on public.shops
  for update using (owner_id = auth.uid());

-- ══════════════════════════════════════════════════════
-- Profiles table (extends auth.users)
-- ══════════════════════════════════════════════════════
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  username text,
  phone text not null default '',
  role text not null default 'owner' check (role in ('owner', 'labour')),
  shop_id uuid references public.shops (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;


create index if not exists profiles_shop_id_idx on public.profiles (shop_id);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = auth.uid());

drop policy if exists "profiles_select_shop" on public.profiles;
create policy "profiles_select_shop" on public.profiles
  for select using (
    shop_id = public.get_user_shop_id(auth.uid())
  );

drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_insert_own_or_owner" on public.profiles;
create policy "profiles_insert_own_or_owner" on public.profiles
  for insert with check (
    id = auth.uid()
    or (
      public.get_user_role(auth.uid()) = 'owner'
      and shop_id = public.get_user_shop_id(auth.uid())
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_or_owner" on public.profiles;
create policy "profiles_update_own_or_owner" on public.profiles
  for update using (
    id = auth.uid()
    or (
      public.get_user_role(auth.uid()) = 'owner'
      and shop_id = public.get_user_shop_id(auth.uid())
    )
  );

-- Owner can delete labour profiles in their shop
drop policy if exists "profiles_delete_owner" on public.profiles;
create policy "profiles_delete_owner" on public.profiles
  for delete using (
    shop_id in (
      select s.id from public.shops s where s.owner_id = auth.uid()
    )
    and id != auth.uid()
  );

-- ══════════════════════════════════════════════════════
-- Repairs table
-- ══════════════════════════════════════════════════════
create table if not exists public.repairs (
  id serial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  order_code text not null default '',
  customer_name text not null,
  phone text not null,
  device_model text not null default '',
  imei text not null default '',
  problem text not null default '',
  lock_type text not null default '',
  lock_value text not null default '',
  warranty text not null default '',
  date_received text not null,
  status text not null default 'pending',
  repair_cost double precision not null default 0,
  expense double precision not null default 0,
  advance_amount double precision not null default 0,
  is_paid boolean not null default false,
  payment_type text not null default 'cash' check (payment_type in ('cash', 'online')),
  image_phone_front text not null default '',
  image_phone_back text not null default '',
  image_thumbnail text not null default '',
  image_id_1 text not null default '',
  image_id_2 text not null default '',
  acc_sim_tray boolean not null default false,
  acc_back_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists repairs_user_id_idx on public.repairs (user_id);
create index if not exists repairs_shop_id_idx on public.repairs (shop_id);
create index if not exists repairs_date_received_idx on public.repairs (date_received desc);

alter table public.repairs enable row level security;

-- All shop members can see all shop repairs
drop policy if exists "repairs_select_own" on public.repairs;
drop policy if exists "repairs_select_shop" on public.repairs;
create policy "repairs_select_shop" on public.repairs
  for select using (
    shop_id = public.get_user_shop_id(auth.uid())
  );

-- All shop members can insert
drop policy if exists "repairs_insert_own" on public.repairs;
drop policy if exists "repairs_insert_shop" on public.repairs;
create policy "repairs_insert_shop" on public.repairs
  for insert with check (
    shop_id = public.get_user_shop_id(auth.uid())
  );

-- Owner can update any; labour can update only own
drop policy if exists "repairs_update_own" on public.repairs;
drop policy if exists "repairs_update_shop" on public.repairs;
create policy "repairs_update_shop" on public.repairs
  for update using (
    shop_id = public.get_user_shop_id(auth.uid())
    and (
      -- Owner can update any
      public.get_user_role(auth.uid()) = 'owner'
      -- Labour can update only own
      or created_by = auth.uid()
    )
  );

-- Owner can delete any; labour can delete only own
drop policy if exists "repairs_delete_own" on public.repairs;
drop policy if exists "repairs_delete_shop" on public.repairs;
create policy "repairs_delete_shop" on public.repairs
  for delete using (
    shop_id = public.get_user_shop_id(auth.uid())
    and (
      public.get_user_role(auth.uid()) = 'owner'
      or created_by = auth.uid()
    )
  );

-- Storage bucket (must exist before policies). App uses bucket id `repair-images` + getPublicUrl.
-- Storage bucket (must exist before policies). App uses bucket id `repair-images` with signed URLs for security.
-- 🔐 SECURITY: Bucket is private (`public = false`). Access is granted via RLS policies and signed URLs.
insert into storage.buckets (id, name, public)
values ('repair-images', 'repair-images', false)
on conflict (id) do update set public = false;

-- Or: Dashboard → Storage → New bucket → id `repair-images`, Public OFF.

drop policy if exists "repair_images_select" on storage.objects;
create policy "repair_images_select" on storage.objects
  for select using (
    bucket_id = 'repair-images'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.get_user_shop_id(auth.uid()) = public.get_user_shop_id((storage.foldername(name))[1]::uuid)
    )
  );

drop policy if exists "repair_images_insert_own" on storage.objects;
create policy "repair_images_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'repair-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "repair_images_update_own" on storage.objects;
create policy "repair_images_update_own" on storage.objects
  for update using (
    bucket_id = 'repair-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "repair_images_delete_own" on storage.objects;
create policy "repair_images_delete_own" on storage.objects
  for delete using (
    bucket_id = 'repair-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Search (avoids fragile .or() filter strings from the client)
create or replace function public.search_repairs_for_user(p_query text)
returns setof public.repairs
language plpgsql
stable
security invoker
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
      r.customer_name ilike '%' || p_query || '%'
      or r.phone ilike '%' || p_query || '%'
      or r.imei ilike '%' || p_query || '%'
      or r.order_code ilike '%' || p_query || '%'
      or r.customer_name ilike '%' || v_safe || '%'
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

-- ══════════════════════════════════════════════════════
-- Inventory Table
-- ══════════════════════════════════════════════════════
create table if not exists public.inventory (
  id serial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete cascade,
  name text not null,
  sku text not null default '',
  stock_count integer not null default 0,
  price double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_user_id_idx on public.inventory (user_id);
create index if not exists inventory_shop_id_idx on public.inventory (shop_id);
create index if not exists inventory_name_idx on public.inventory (name);

alter table public.inventory enable row level security;

drop policy if exists "inventory_select_own" on public.inventory;
drop policy if exists "inventory_select_shop" on public.inventory;
create policy "inventory_select_shop" on public.inventory
  for select using (
    shop_id = public.get_user_shop_id(auth.uid())
  );

drop policy if exists "inventory_insert_own" on public.inventory;
drop policy if exists "inventory_insert_shop" on public.inventory;
create policy "inventory_insert_shop" on public.inventory
  for insert with check (
    shop_id = public.get_user_shop_id(auth.uid())
    and public.get_user_role(auth.uid()) = 'owner'
  );

drop policy if exists "inventory_update_own" on public.inventory;
drop policy if exists "inventory_update_shop" on public.inventory;
create policy "inventory_update_shop" on public.inventory
  for update using (
    shop_id = public.get_user_shop_id(auth.uid())
    and public.get_user_role(auth.uid()) = 'owner'
  );

drop policy if exists "inventory_delete_own" on public.inventory;
drop policy if exists "inventory_delete_shop" on public.inventory;
create policy "inventory_delete_shop" on public.inventory
  for delete using (
    shop_id = public.get_user_shop_id(auth.uid())
    and public.get_user_role(auth.uid()) = 'owner'
  );

-- ══════════════════════════════════════════════════════
-- MIGRATION: For existing users who signed up before roles
-- Run this AFTER creating the tables above.
-- It creates a shop + profile for every existing auth user
-- that doesn't have a profile yet, and links their repairs.
-- ══════════════════════════════════════════════════════
-- do $$
-- declare
--   u record;
--   new_shop_id uuid;
-- begin
--   for u in
--     select au.id
--     from auth.users au
--     left join public.profiles p on p.id = au.id
--     where p.id is null
--   loop
--     new_shop_id := uuid_generate_v4();
--     insert into public.shops (id, shop_name, owner_id)
--     values (new_shop_id, '', u.id);
--     insert into public.profiles (id, name, phone, role, shop_id)
--     values (u.id, '', '', 'owner', new_shop_id);
--     update public.repairs set shop_id = new_shop_id, created_by = u.id where user_id = u.id and shop_id is null;
--     update public.inventory set shop_id = new_shop_id where user_id = u.id and shop_id is null;
--   end loop;
-- end;
-- $$;

-- ══════════════════════════════════════════════════════
-- Admin Reset Labour Password function
-- ══════════════════════════════════════════════════════
create or replace function public.admin_reset_labour_password(p_labour_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_caller_role text;
  v_caller_shop_id uuid;
  v_labour_shop_id uuid;
begin
  -- 1. Get the caller's role and shop_id
  select role, shop_id into v_caller_role, v_caller_shop_id
  from public.profiles
  where id = auth.uid();

  -- Check if caller is owner/admin
  if v_caller_role != 'owner' then
    raise exception 'Only owners can reset labour passwords';
  end if;

  -- 2. Get the target labour's shop_id
  select shop_id into v_labour_shop_id
  from public.profiles
  where id = p_labour_id;

  -- Check if they belong to the same shop
  if v_caller_shop_id != v_labour_shop_id then
    raise exception 'Labour user does not belong to your shop';
  end if;

  -- 3. Update the password in auth.users
  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf'))
  where id = p_labour_id;
end;
$$;

grant execute on function public.admin_reset_labour_password(uuid, text) to authenticated;

-- ══════════════════════════════════════════════════════
-- App versions table (for OTA updates)
-- ══════════════════════════════════════════════════════
create table if not exists public.app_versions (
  id serial primary key,
  version_code integer not null,
  version_name text not null,
  apk_url text not null,
  changelog text not null default '',
  is_force_update boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS and allow public read access
alter table public.app_versions enable row level security;

drop policy if exists "Allow public select on app_versions" on public.app_versions;
create policy "Allow public select on app_versions" on public.app_versions
  for select using (true);

-- Explicitly deny all client-side writes (only manage via Supabase Dashboard or service_role API)
drop policy if exists "Deny insert on app_versions" on public.app_versions;
create policy "Deny insert on app_versions" on public.app_versions
  for insert with check (false);

drop policy if exists "Deny update on app_versions" on public.app_versions;
create policy "Deny update on app_versions" on public.app_versions
  for update using (false);

drop policy if exists "Deny delete on app_versions" on public.app_versions;
create policy "Deny delete on app_versions" on public.app_versions
  for delete using (false);




