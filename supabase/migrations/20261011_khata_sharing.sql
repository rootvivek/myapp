-- Explicit, consent-based Khata sharing.
-- Phone matching is intentionally not implemented here: the current app's
-- MSG91 verification runs in the client and is not an authenticated Supabase
-- phone claim. The owner must deliver the invitation token out of band, and
-- the receiving authenticated account explicitly redeems it.

create table if not exists public.khata_party_links (
  id uuid primary key default gen_random_uuid(),
  party_id uuid not null references public.khata_parties(id) on delete cascade,
  shop_owner_id uuid not null references auth.users(id) on delete cascade,
  client_user_id uuid references auth.users(id) on delete cascade,
  invite_token_hash text unique,
  link_status text not null default 'pending'
    check (link_status in ('pending', 'active', 'rejected', 'revoked', 'expired')),
  consent_status text not null default 'pending'
    check (consent_status in ('pending', 'accepted', 'rejected', 'revoked')),
  expires_at timestamptz not null default (now() + interval '30 days'),
  linked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint khata_party_links_identity_check check (
    (client_user_id is null and invite_token_hash is not null)
    or (client_user_id is not null and invite_token_hash is null)
  )
);

create unique index if not exists khata_party_links_one_active_client_idx
  on public.khata_party_links (party_id, client_user_id)
  where client_user_id is not null and link_status = 'active';

create index if not exists khata_party_links_client_status_idx
  on public.khata_party_links (client_user_id, link_status);
create index if not exists khata_party_links_party_status_idx
  on public.khata_party_links (party_id, link_status);
alter table public.khata_party_links enable row level security;
revoke all on public.khata_party_links from public, anon, authenticated;

-- Tokens are generated and persisted only as SHA-256 hashes. A party ID alone
-- can never be used to create or redeem a link.
create or replace function public.khata_create_share_invite(p_party_id uuid)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_party public.khata_parties%rowtype;
  v_token text;
begin
  if v_actor is null then raise exception 'Authentication required'; end if;
  select * into v_party from public.khata_parties where id = p_party_id;
  if not found or not (
    v_party.user_id = v_actor
    or (v_party.shop_id is not null and v_party.shop_id = public.get_user_shop_id(v_actor))
  ) then raise exception 'Party not found or not authorized'; end if;
  if v_party.shop_id is not null and not exists (
    select 1 from public.shops s where s.id = v_party.shop_id and s.owner_id = v_actor
  ) then raise exception 'Only the shop owner can share this ledger'; end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.khata_party_links (party_id, shop_owner_id, invite_token_hash)
  values (v_party.id, v_actor, encode(extensions.digest(v_token, 'sha256'), 'hex'));
  return v_token;
end;
$$;

create or replace function public.khata_redeem_share_invite(p_token text, p_accept boolean)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_actor uuid := auth.uid();
  v_link public.khata_party_links%rowtype;
begin
  if v_actor is null then raise exception 'Authentication required'; end if;
  if p_token is null or length(p_token) <> 64 or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid or expired invitation';
  end if;
  select * into v_link from public.khata_party_links
   where invite_token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and client_user_id is null and link_status = 'pending'
     and expires_at > now()
   for update;
  if not found then raise exception 'Invalid or expired invitation'; end if;

  update public.khata_party_links set
    client_user_id = v_actor,
    invite_token_hash = null,
    link_status = case when p_accept then 'active' else 'rejected' end,
    consent_status = case when p_accept then 'accepted' else 'rejected' end,
    linked_at = case when p_accept then now() else null end,
    updated_at = now()
  where id = v_link.id;
  return case when p_accept then 'active' else 'rejected' end;
exception when unique_violation then
  raise exception 'This account already has a relationship for that party';
end;
$$;

create or replace function public.khata_revoke_share(p_link_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.khata_party_links l set
    link_status = 'revoked', consent_status = 'revoked', updated_at = now()
  where l.id = p_link_id
    and (l.shop_owner_id = auth.uid() or l.client_user_id = auth.uid());
  if not found then raise exception 'Relationship not found or not authorized'; end if;
end;
$$;

-- Client read model deliberately omits party phone, private party notes, and
-- transaction note. It returns only the owner's identity, party display name,
-- and source-of-truth transaction fields for active, consented relationships.
create or replace function public.khata_list_shared_ledgers()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'link_id', l.id,
    'party_id', p.id,
    'party_name', p.name,
    'shop_name', coalesce(s.shop_name, 'Shop'),
    'transactions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id,
        'transaction_type', t.transaction_type,
        'amount_paise', t.amount_paise,
        'transaction_date', t.transaction_date,
        'created_at', t.created_at,
        'correction_ref_id', t.correction_ref_id,
        'balance_delta_paise', case
          when t.transaction_type in ('purchase', 'payment_received') then t.amount_paise
          when t.transaction_type in ('sale', 'payment_given') then -t.amount_paise
          when t.transaction_type in ('opening_balance', 'adjustment') and lower(btrim(t.note)) like 'decrease:%' then -t.amount_paise
          when t.transaction_type in ('opening_balance', 'adjustment') then t.amount_paise
          else 0
        end
      ) order by t.transaction_date desc, t.created_at desc)
      from public.khata_transactions t where t.party_id = p.id
    ), '[]'::jsonb)
  )), '[]'::jsonb)
  from public.khata_party_links l
  join public.khata_parties p on p.id = l.party_id
  left join public.shops s on s.id = p.shop_id
  where l.client_user_id = auth.uid()
    and l.link_status = 'active'
    and l.consent_status = 'accepted'
$$;

-- Owner gets status for their own party; clients have no direct relation-table
-- access. The sanitized read model above is the only client ledger entry point.
create or replace function public.khata_list_party_shares(p_party_id uuid)
returns table(link_id uuid, link_status text, consent_status text, created_at timestamptz, linked_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, l.link_status, l.consent_status, l.created_at, l.linked_at
  from public.khata_party_links l
  join public.khata_parties p on p.id = l.party_id
  where p.id = p_party_id
    and (p.user_id = auth.uid() or (p.shop_id is not null and p.shop_id = public.get_user_shop_id(auth.uid())))
$$;

revoke execute on function public.khata_create_share_invite(uuid) from public, anon;
revoke execute on function public.khata_redeem_share_invite(text, boolean) from public, anon;
revoke execute on function public.khata_revoke_share(uuid) from public, anon;
revoke execute on function public.khata_list_shared_ledgers() from public, anon;
revoke execute on function public.khata_list_party_shares(uuid) from public, anon;
grant execute on function public.khata_create_share_invite(uuid) to authenticated;
grant execute on function public.khata_redeem_share_invite(text, boolean) to authenticated;
grant execute on function public.khata_revoke_share(uuid) to authenticated;
grant execute on function public.khata_list_shared_ledgers() to authenticated;
grant execute on function public.khata_list_party_shares(uuid) to authenticated;