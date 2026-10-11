-- Ensure shop logos can be uploaded and referenced by profiles on existing projects.
alter table public.profiles
  add column if not exists shop_logo_url text;

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
