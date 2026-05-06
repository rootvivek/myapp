-- Run this in the Supabase SQL Editor (Dashboard → SQL) after creating a project.
-- 1. Create tables & policies
-- 2. Storage: create bucket "repair-images" (public) — or use private bucket + signed URLs (adjust app if needed)

create extension if not exists "uuid-ossp";

create table if not exists public.repairs (
  id serial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  order_code text not null default '',
  customer_name text not null,
  phone text not null,
  device_model text not null default '',
  imei text not null default '',
  problem text not null default '',
  date_received text not null,
  status text not null default 'pending',
  repair_cost double precision not null default 0,
  advance_amount double precision not null default 0,
  is_paid boolean not null default false,
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
create index if not exists repairs_date_received_idx on public.repairs (date_received desc);

alter table public.repairs enable row level security;

drop policy if exists "repairs_select_own" on public.repairs;
create policy "repairs_select_own" on public.repairs
  for select using (auth.uid() = user_id);

drop policy if exists "repairs_insert_own" on public.repairs;
create policy "repairs_insert_own" on public.repairs
  for insert with check (auth.uid() = user_id);

drop policy if exists "repairs_update_own" on public.repairs;
create policy "repairs_update_own" on public.repairs
  for update using (auth.uid() = user_id);

drop policy if exists "repairs_delete_own" on public.repairs;
create policy "repairs_delete_own" on public.repairs
  for delete using (auth.uid() = user_id);

-- Storage bucket (must exist before policies). App uses bucket id `repair-images` + getPublicUrl.
insert into storage.buckets (id, name, public)
values ('repair-images', 'repair-images', true)
on conflict (id) do update set public = excluded.public;

-- Or: Dashboard → Storage → New bucket → id `repair-images`, Public ON.

drop policy if exists "repair_images_select" on storage.objects;
create policy "repair_images_select" on storage.objects
  for select using (bucket_id = 'repair-images');

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
language sql
stable
security invoker
set search_path = public
as $$
  select *
  from public.repairs r
  where r.user_id = auth.uid()
  and (
    r.customer_name ilike '%' || p_query || '%'
    or r.phone ilike '%' || p_query || '%'
    or r.imei ilike '%' || p_query || '%'
    or r.order_code ilike '%' || p_query || '%'
  )
  order by r.date_received desc, r.id desc;
$$;

grant execute on function public.search_repairs_for_user(text) to authenticated;
