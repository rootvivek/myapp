-- Khata Book tables and tenant-safe row-level security.
-- The client service writes user_id and shop_id on every insert; those
-- values are checked against the authenticated user's context below.

create table if not exists public.khata_parties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete cascade,
  name text not null check (length(btrim(name)) >= 2),
  phone text not null default '',
  party_type text not null check (party_type in ('seller', 'dealer', 'supplier', 'customer', 'other')),
  notes text not null default '',
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, shop_id)
);

create table if not exists public.khata_transactions (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  shop_id uuid references public.shops (id) on delete cascade,
  transaction_type text not null check (
    transaction_type in ('purchase', 'sale', 'payment_given', 'payment_received', 'opening_balance', 'adjustment')
  ),
  amount_paise bigint not null check (amount_paise > 0),
  transaction_date date not null,
  note text not null default '',
  correction_ref_id uuid references public.khata_transactions (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint khata_transactions_party_id_fkey
    foreign key (party_id) references public.khata_parties (id) on delete cascade,
  constraint khata_transactions_party_scope_fkey
    foreign key (party_id, shop_id) references public.khata_parties (id, shop_id)
      on delete cascade
);

create index if not exists khata_parties_user_id_idx on public.khata_parties (user_id);
create index if not exists khata_parties_shop_id_idx on public.khata_parties (shop_id);
create index if not exists khata_transactions_party_date_idx
  on public.khata_transactions (party_id, transaction_date desc, created_at desc);
create index if not exists khata_transactions_user_id_idx on public.khata_transactions (user_id);

alter table public.khata_parties enable row level security;
alter table public.khata_transactions enable row level security;

revoke all on public.khata_parties from anon, public;
revoke all on public.khata_transactions from anon, public;

drop policy if exists khata_parties_select_scope on public.khata_parties;
create policy khata_parties_select_scope on public.khata_parties
  for select to authenticated using (
    user_id = auth.uid()
    or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid()))
  );

drop policy if exists khata_parties_insert_scope on public.khata_parties;
create policy khata_parties_insert_scope on public.khata_parties
  for insert to authenticated with check (
    user_id = auth.uid()
    and (shop_id is null or shop_id = public.get_user_shop_id(auth.uid()))
  );

drop policy if exists khata_parties_update_scope on public.khata_parties;
create policy khata_parties_update_scope on public.khata_parties
  for update to authenticated
  using (user_id = auth.uid() or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid())))
  with check (
    (
      user_id = auth.uid()
      or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid()))
    )
    and shop_id is not distinct from public.get_user_shop_id(auth.uid())
  );

drop policy if exists khata_parties_delete_scope on public.khata_parties;
create policy khata_parties_delete_scope on public.khata_parties
  for delete to authenticated using (
    user_id = auth.uid()
    or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid()))
  );

drop policy if exists khata_transactions_select_scope on public.khata_transactions;
create policy khata_transactions_select_scope on public.khata_transactions
  for select to authenticated using (
    user_id = auth.uid()
    or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid()))
  );

drop policy if exists khata_transactions_insert_scope on public.khata_transactions;
create policy khata_transactions_insert_scope on public.khata_transactions
  for insert to authenticated with check (
    user_id = auth.uid()
    and shop_id is not distinct from public.get_user_shop_id(auth.uid())
    and exists (
      select 1 from public.khata_parties p
      where p.id = party_id
        and (
          p.user_id = auth.uid()
          or (p.shop_id is not null and p.shop_id = public.get_user_shop_id(auth.uid()))
        )
        and p.shop_id is not distinct from shop_id
    )
  );

drop policy if exists khata_transactions_update_scope on public.khata_transactions;
create policy khata_transactions_update_scope on public.khata_transactions
  for update to authenticated
  using (user_id = auth.uid() or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid())))
  with check (
    (
      user_id = auth.uid()
      or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid()))
    )
    and shop_id is not distinct from public.get_user_shop_id(auth.uid())
    and exists (
      select 1 from public.khata_parties p
      where p.id = party_id
        and (
          p.user_id = auth.uid()
          or (p.shop_id is not null and p.shop_id = public.get_user_shop_id(auth.uid()))
        )
        and p.shop_id is not distinct from shop_id
    )
  );

drop policy if exists khata_transactions_delete_scope on public.khata_transactions;
create policy khata_transactions_delete_scope on public.khata_transactions
  for delete to authenticated using (
    user_id = auth.uid()
    or (shop_id is not null and shop_id = public.get_user_shop_id(auth.uid()))
  );

grant select, insert, update, delete on public.khata_parties to authenticated;
grant select, insert, update, delete on public.khata_transactions to authenticated;