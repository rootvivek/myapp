
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

-- Migration: ensure shops_owner_id_fkey points to auth.users (not profiles).
-- Older schemas may have the wrong constraint, which breaks the backfill below.
alter table public.shops drop constraint if exists shops_owner_id_fkey;
alter table public.shops add constraint shops_owner_id_fkey
  foreign key (owner_id) references auth.users (id) on delete cascade;

-- Contact number printed on invoices, captured once at signup.
alter table public.shops add column if not exists phone text not null default '';

-- owner_id is filtered by RLS + getUserShops(); without this index every lookup is a seq scan.
create index if not exists shops_owner_id_idx on public.shops (owner_id);

alter table public.shops enable row level security;

drop policy if exists "shops_select_member" on public.shops;
create policy "shops_select_member" on public.shops
  for select using (
    id = (select public.get_user_shop_id((select auth.uid())))
  );

drop policy if exists "shops_select_owner" on public.shops;
create policy "shops_select_owner" on public.shops
  for select using (
    owner_id = (select auth.uid())
  );

drop policy if exists "shops_insert_owner" on public.shops;
create policy "shops_insert_owner" on public.shops
  for insert with check (owner_id = (select auth.uid()));

drop policy if exists "shops_update_owner" on public.shops;
create policy "shops_update_owner" on public.shops
  for update using (owner_id = (select auth.uid()));

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
alter table public.profiles add column if not exists shop_logo_url text;

-- Migration: drop shop_name from profiles if it exists (was moved to shops table only)
alter table public.profiles drop column if exists shop_name;


create index if not exists profiles_shop_id_idx on public.profiles (shop_id);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (id = (select auth.uid()));

drop policy if exists "profiles_select_shop" on public.profiles;
create policy "profiles_select_shop" on public.profiles
  for select using (
    shop_id = (select public.get_user_shop_id((select auth.uid())))
  );

drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_insert_own_or_owner" on public.profiles;
create policy "profiles_insert_own_or_owner" on public.profiles
  for insert with check (
    id = (select auth.uid())
    or (
      (select public.get_user_role((select auth.uid()))) = 'owner'
      and shop_id = (select public.get_user_shop_id((select auth.uid())))
    )
  );

drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_own_or_owner" on public.profiles;
create policy "profiles_update_own_or_owner" on public.profiles
  for update using (
    id = (select auth.uid())
    or (
      (select public.get_user_role((select auth.uid()))) = 'owner'
      and shop_id = (select public.get_user_shop_id((select auth.uid())))
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

-- ═════════════════════════════════════════════════════
-- Signup safety net: every auth user ALWAYS gets a profile row, and every
-- owner ALWAYS gets a shop row.
--
-- Before this trigger the client was the only thing creating those rows, so
-- any client-side error (or Supabase "Confirm email" returning a user with no
-- session) left an auth user with NO public.profiles / public.shops row.
-- get_user_shop_id() then returns NULL, which breaks repairs, inventory and
-- every shop-scoped RLS policy.
--
-- SECURITY DEFINER so it bypasses RLS, and fully defensive so that it can
-- never cause an auth.users insert (i.e. a signup) to fail.
-- ══════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text;
  v_name text;
  v_phone text;
  v_shop_name text;
  v_shop_id uuid;
begin
  v_role := coalesce(nullif(btrim(new.raw_user_meta_data ->> 'role'), ''), 'owner');
  if v_role not in ('owner', 'labour') then
    v_role := 'owner';
  end if;

  v_name := coalesce(btrim(new.raw_user_meta_data ->> 'name'), '');
  v_phone := coalesce(btrim(new.raw_user_meta_data ->> 'phone'), '');
  v_shop_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'shop_name'), ''),
    'MCA Phone Wala'
  );

  if v_role = 'labour' then
    -- Staff never own a shop: attach to the owner's shop from the signup metadata.
    begin
      v_shop_id := nullif(btrim(new.raw_user_meta_data ->> 'shop_id'), '')::uuid;
    exception when others then
      v_shop_id := null;
    end;
  else
    -- Reuse the owner's existing shop when there is one (retries / re-runs stay idempotent).
    begin
      select s.id into v_shop_id
      from public.shops s
      where s.owner_id = new.id
      order by s.created_at asc, s.id asc
      limit 1;

      if v_shop_id is null then
        insert into public.shops (shop_name, owner_id, phone)
        values (v_shop_name, new.id, v_phone)
        returning id into v_shop_id;
      elsif v_phone <> '' then
        -- Keep the shop's contact number in sync with the owner's signup phone.
        update public.shops set phone = v_phone where id = v_shop_id and phone = '';
      end if;
    exception when others then
      raise exception 'handle_new_user: shop setup failed for % (%): %', new.id, v_role, sqlerrm;
    end;
  end if;

  begin
    insert into public.profiles (id, name, phone, role, shop_id)
    values (new.id, v_name, v_phone, v_role, v_shop_id)
    on conflict (id) do nothing;
  exception when others then
    raise warning 'handle_new_user: profile setup failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger functions execute with the trigger owner's privileges and never need
-- to be callable through PostgREST, so keep them out of reach of API roles.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

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

-- Migration: add user_id column if the table was created before this column existed.
-- Existing rows get NULL; the app backfills them on next load.
alter table public.repairs add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists repairs_user_id_idx on public.repairs (user_id);
create index if not exists repairs_shop_id_idx on public.repairs (shop_id);
create index if not exists repairs_date_received_idx on public.repairs (date_received desc);
create index if not exists repairs_created_by_idx on public.repairs (created_by);

alter table public.repairs enable row level security;

-- All shop members can see all shop repairs
drop policy if exists "repairs_select_own" on public.repairs;
drop policy if exists "repairs_select_shop" on public.repairs;
create policy "repairs_select_shop" on public.repairs
  for select using (
    user_id = auth.uid()
    or shop_id = public.get_user_shop_id(auth.uid())
  );

-- All shop members can insert (also allows users without a shop_id yet to
-- create repairs — the shop_id gets backfilled once their shop is created)
drop policy if exists "repairs_insert_own" on public.repairs;
drop policy if exists "repairs_insert_shop" on public.repairs;
create policy "repairs_insert_shop" on public.repairs
  for insert with check (
    user_id = auth.uid()
    and (
      shop_id = public.get_user_shop_id(auth.uid())
      or shop_id is null
    )
  );

-- Owner can update any; labour can update only own
-- Users without a shop_id can also update their own repairs
drop policy if exists "repairs_update_own" on public.repairs;
drop policy if exists "repairs_update_shop" on public.repairs;
create policy "repairs_update_shop" on public.repairs
  for update using (
    created_by = auth.uid()
    or (
      shop_id = public.get_user_shop_id(auth.uid())
      and public.get_user_role(auth.uid()) = 'owner'
    )
  );

-- Owner can delete any; labour can delete only own
-- Users without a shop_id can also delete their own repairs
drop policy if exists "repairs_delete_own" on public.repairs;
drop policy if exists "repairs_delete_shop" on public.repairs;
create policy "repairs_delete_shop" on public.repairs
  for delete using (
    created_by = auth.uid()
    or (
      shop_id = public.get_user_shop_id(auth.uid())
      and public.get_user_role(auth.uid()) = 'owner'
    )
  );

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

insert into storage.buckets (id, name, public)
values ('shop-logos', 'shop-logos', true)
on conflict (id) do update set public = true;

drop policy if exists "shop_logos_select" on storage.objects;
create policy "shop_logos_select" on storage.objects
  for select using (bucket_id = 'shop-logos');

drop policy if exists "shop_logos_insert_own" on storage.objects;
create policy "shop_logos_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'shop-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "shop_logos_update_own" on storage.objects;
create policy "shop_logos_update_own" on storage.objects
  for update using (
    bucket_id = 'shop-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "shop_logos_delete_own" on storage.objects;
create policy "shop_logos_delete_own" on storage.objects
  for delete using (
    bucket_id = 'shop-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Search (avoids fragile .or() filter strings from the client)
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

-- Migration: add user_id column if the table was created before this column existed.
-- Existing rows get NULL; the app backfills them on next load.
alter table public.inventory add column if not exists user_id uuid references auth.users (id) on delete cascade;

create index if not exists inventory_user_id_idx on public.inventory (user_id);
create index if not exists inventory_shop_id_idx on public.inventory (shop_id);
create index if not exists inventory_name_idx on public.inventory (name);

alter table public.inventory enable row level security;

drop policy if exists "inventory_select_own" on public.inventory;
drop policy if exists "inventory_select_shop" on public.inventory;
create policy "inventory_select_shop" on public.inventory
  for select using (
    public.get_user_shop_id(auth.uid()) is null
    or shop_id = public.get_user_shop_id(auth.uid())
  );

drop policy if exists "inventory_insert_own" on public.inventory;
drop policy if exists "inventory_insert_shop" on public.inventory;
create policy "inventory_insert_shop" on public.inventory
  for insert with check (
    public.get_user_shop_id(auth.uid()) is null
    or shop_id = public.get_user_shop_id(auth.uid())
  );

drop policy if exists "inventory_update_own" on public.inventory;
drop policy if exists "inventory_update_shop" on public.inventory;
create policy "inventory_update_shop" on public.inventory
  for update using (
    public.get_user_shop_id(auth.uid()) is null
    or shop_id = public.get_user_shop_id(auth.uid())
  );

drop policy if exists "inventory_delete_own" on public.inventory;
drop policy if exists "inventory_delete_shop" on public.inventory;
create policy "inventory_delete_shop" on public.inventory
  for delete using (
    public.get_user_shop_id(auth.uid()) is null
    or shop_id = public.get_user_shop_id(auth.uid())
  );

-- ══════════════════════════════════════════════════════
-- MIGRATION / REPAIR: existing auth users that never got a profile+shop
-- (this is the "skipped profile and shop table" state left behind by the
-- old client-only flow). Idempotent: only touches users with no profile row.
-- It also re-links their orphaned repairs/inventory.
-- ══════════════════════════════════════════════════════
do $$
declare
  u record;
  v_role text;
  v_name text;
  v_phone text;
  v_shop_name text;
  v_shop_id uuid;
begin
  for u in
    select au.id, au.raw_user_meta_data
    from auth.users au
    left join public.profiles p on p.id = au.id
    where p.id is null
  loop
    v_role := coalesce(nullif(btrim(u.raw_user_meta_data ->> 'role'), ''), 'owner');
    if v_role not in ('owner', 'labour') then
      v_role := 'owner';
    end if;

    v_name := coalesce(btrim(u.raw_user_meta_data ->> 'name'), '');
    v_phone := coalesce(btrim(u.raw_user_meta_data ->> 'phone'), '');
    v_shop_name := coalesce(
      nullif(btrim(u.raw_user_meta_data ->> 'shop_name'), ''),
      'MCA Phone Wala'
    );

    v_shop_id := null;
    if v_role = 'labour' then
      begin
        v_shop_id := nullif(btrim(u.raw_user_meta_data ->> 'shop_id'), '')::uuid;
      exception when others then
        v_shop_id := null;
      end;
    end if;

    if v_shop_id is null then
      select s.id into v_shop_id
      from public.shops s
      where s.owner_id = u.id
      order by s.created_at asc, s.id asc
      limit 1;
    end if;

    -- Only mint a shop for owners; staff with an unresolved shop stay unattached.
    if v_role = 'owner' then
      -- Create the profile first so that any foreign-key constraint on
      -- shops.owner_id → profiles.id is satisfied when we insert the shop.
      insert into public.profiles (id, name, phone, role, shop_id)
      values (u.id, v_name, v_phone, v_role, null)
      on conflict (id) do nothing;

      if v_shop_id is null then
        insert into public.shops (shop_name, owner_id, phone)
        values (v_shop_name, u.id, v_phone)
        returning id into v_shop_id;

        -- Link the profile to the newly created shop
        update public.profiles set shop_id = v_shop_id
        where id = u.id and shop_id is null;
      elsif v_phone <> '' then
        update public.shops set phone = v_phone where id = v_shop_id and phone = '';
      end if;
    else
      -- labour: just insert the profile with whatever shop_id we already resolved
      insert into public.profiles (id, name, phone, role, shop_id)
      values (u.id, v_name, v_phone, v_role, v_shop_id)
      on conflict (id) do nothing;
    end if;

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

-- ══════════════════════════════════════════════════════
-- BACKFILL: shops created before `shops.phone` existed (or created outside the
-- signup trigger) inherit their owner's phone so invoices print the real shop
-- number instead of a placeholder. Idempotent: only fills empty values.
-- ══════════════════════════════════════════════════════
update public.shops s
set phone = btrim(p.phone)
from public.profiles p
where p.id = s.owner_id
  and coalesce(btrim(s.phone), '') = ''
  and coalesce(btrim(p.phone), '') <> '';

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




