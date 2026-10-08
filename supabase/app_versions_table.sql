-- Supabase migration: create app_versions table for auto-updater
-- Run this in Supabase Dashboard → SQL Editor

create table if not exists public.app_versions (
  id bigserial primary key,
  version_code int not null unique,
  version_name text not null,
  apk_url text not null,
  changelog text,
  is_force_update boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.app_versions enable row level security;

-- Allow anon/public read access (for app auto-updater)
create policy "Public read app versions"
  on public.app_versions
  for select
  using (true);

-- Allow service role full access (for release script)
create policy "Service role manage app versions"
  on public.app_versions
  for all
  using (auth.role() = 'service_role');

-- Index for fast lookups
create index if not exists idx_app_versions_version_code
  on public.app_versions (version_code desc);

-- Trigger to auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists set_app_versions_updated_at on public.app_versions;
create trigger set_app_versions_updated_at
before update on public.app_versions
for each row execute function public.set_updated_at();

-- Grant permissions
grant select on public.app_versions to anon, authenticated;
grant all on public.app_versions to service_role;