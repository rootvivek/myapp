-- Buy & Sell Records table and tenant-safe row-level security.

create table if not exists public.buy_sell_records (
  id serial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  order_code text not null default '',
  type text not null check (type in ('buy', 'sell')),
  customer_name text not null default '',
  phone text not null default '',
  device_model text not null default '',
  imei text not null default '',
  price numeric not null default 0,
  notes text not null default '',
  date date not null,
  device_image text not null default '',
  id_proof_image text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buy_sell_records_user_id_idx on public.buy_sell_records (user_id);
create index if not exists buy_sell_records_shop_id_idx on public.buy_sell_records (shop_id);

alter table public.buy_sell_records enable row level security;

create policy "Users can view own buy sell records"
  on public.buy_sell_records for select
  using (
    user_id = auth.uid()
    or (shop_id is not null and shop_id in (
      select shop_id from public.profiles where id = auth.uid()
    ))
  );

create policy "Users can insert own buy sell records"
  on public.buy_sell_records for insert
  with check (
    user_id = auth.uid()
    or (shop_id is not null and shop_id in (
      select shop_id from public.profiles where id = auth.uid()
    ))
  );

create policy "Users can update own buy sell records"
  on public.buy_sell_records for update
  using (
    user_id = auth.uid()
    or (shop_id is not null and shop_id in (
      select shop_id from public.profiles where id = auth.uid()
    ))
  );
