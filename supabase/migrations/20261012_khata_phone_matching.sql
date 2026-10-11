-- Trusted phone claims and consent-gated Khata discovery.
-- A claim is written only by the OTP backend using the service-role key after
-- verifying the MSG91 OTP and the caller's Supabase access token.

create table if not exists public.verified_phone_identities (
  user_id uuid primary key references auth.users(id) on delete cascade,
  phone_e164 text not null unique check (phone_e164 ~ '^[+]91[6-9][0-9]{9}$'),
  verified_at timestamptz not null default now()
);
alter table public.verified_phone_identities enable row level security;
revoke all on public.verified_phone_identities from public, anon, authenticated;
grant all on public.verified_phone_identities to service_role;

-- Phone discovery creates a pending relationship for an exact, unique match.
create unique index if not exists khata_party_links_one_pending_client_idx
  on public.khata_party_links (party_id, client_user_id)
  where client_user_id is not null and link_status = 'pending';

create or replace function public.khata_match_verified_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_party_id uuid;
  v_match_count integer;
begin
  -- Current phone identity policy is one active verified number per account.
  select count(*) into v_match_count
  from public.khata_parties p
  where case
    when length(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 12
      and left(regexp_replace(p.phone, '[^0-9]', '', 'g'), 2) = '91'
      then right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10)
    when length(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 11
      and left(regexp_replace(p.phone, '[^0-9]', '', 'g'), 1) = '0'
      then right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10)
    else regexp_replace(p.phone, '[^0-9]', '', 'g')
  end = right(regexp_replace(new.phone_e164, '[^0-9]', '', 'g'), 10)
    and not p.is_archived;

  -- Zero and ambiguous matches are deliberately indistinguishable to access
  -- control: neither case creates a link.
  if v_match_count <> 1 then return new; end if;

  select p.id into v_party_id
  from public.khata_parties p
  where case
    when length(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 12
      and left(regexp_replace(p.phone, '[^0-9]', '', 'g'), 2) = '91'
      then right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10)
    when length(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 11
      and left(regexp_replace(p.phone, '[^0-9]', '', 'g'), 1) = '0'
      then right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10)
    else regexp_replace(p.phone, '[^0-9]', '', 'g')
  end = right(regexp_replace(new.phone_e164, '[^0-9]', '', 'g'), 10)
    and not p.is_archived;

  update public.khata_party_links
  set link_status = 'expired', updated_at = now()
  where party_id = v_party_id and client_user_id = new.user_id
    and link_status = 'pending' and expires_at <= now();

  insert into public.khata_party_links
    (party_id, shop_owner_id, client_user_id, invite_token_hash, link_status, consent_status, expires_at)
  select p.id, coalesce(s.owner_id, p.user_id), new.user_id, null, 'pending', 'pending', now() + interval '30 days'
  from public.khata_parties p
  left join public.shops s on s.id = p.shop_id
  where p.id = v_party_id
    and p.user_id <> new.user_id
    and not exists (
      select 1 from public.khata_party_links l
      where l.party_id = p.id and l.client_user_id = new.user_id
        and l.link_status in ('pending', 'active')
    );
  return new;
end;
$$;

drop trigger if exists khata_match_verified_phone_trigger on public.verified_phone_identities;
create trigger khata_match_verified_phone_trigger
  after insert or update of phone_e164 on public.verified_phone_identities
  for each row execute function public.khata_match_verified_phone();

create or replace function public.khata_list_phone_match_requests()
returns table(link_id uuid, party_name text, shop_name text, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select l.id, p.name, coalesce(s.shop_name, 'Shop'), l.created_at
  from public.khata_party_links l
  join public.khata_parties p on p.id = l.party_id
  left join public.shops s on s.id = p.shop_id
  where l.client_user_id = auth.uid()
    and l.link_status = 'pending'
    and l.consent_status = 'pending'
    and l.expires_at > now()
    and l.invite_token_hash is null
  order by l.created_at desc;
$$;

create or replace function public.khata_respond_phone_match(p_link_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.khata_party_links l set
    link_status = case when p_accept then 'active' else 'rejected' end,
    consent_status = case when p_accept then 'accepted' else 'rejected' end,
    linked_at = case when p_accept then now() else null end,
    updated_at = now()
  where l.id = p_link_id and l.client_user_id = auth.uid()
    and l.link_status = 'pending' and l.consent_status = 'pending'
    and l.invite_token_hash is null and l.expires_at > now();
  if not found then raise exception 'Request not found or expired'; end if;
end;
$$;

revoke execute on function public.khata_list_phone_match_requests() from public, anon;
revoke execute on function public.khata_respond_phone_match(uuid, boolean) from public, anon;
grant execute on function public.khata_list_phone_match_requests() to authenticated;
grant execute on function public.khata_respond_phone_match(uuid, boolean) to authenticated;

-- Party phones are often entered before account verification. When a party is
-- later added/edited, repeat the same unique-match process against verified
-- identities so registration order does not change matching behavior.
create or replace function public.khata_match_new_party_phone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone_digits text := regexp_replace(new.phone, '[^0-9]', '', 'g');
  v_phone_ten text;
  v_identity record;
  v_match_count integer;
begin
  if new.is_archived or v_phone_digits = '' then return new; end if;
  if length(v_phone_digits) = 12 and left(v_phone_digits, 2) = '91' then
    v_phone_ten := right(v_phone_digits, 10);
  elsif length(v_phone_digits) = 11 and left(v_phone_digits, 1) = '0' then
    v_phone_ten := right(v_phone_digits, 10);
  else
    v_phone_ten := v_phone_digits;
  end if;
  if length(v_phone_ten) <> 10 then return new; end if;

  select count(*) into v_match_count from public.khata_parties p
  where not p.is_archived and case
    when length(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 12
      and left(regexp_replace(p.phone, '[^0-9]', '', 'g'), 2) = '91'
      then right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10)
    when length(regexp_replace(p.phone, '[^0-9]', '', 'g')) = 11
      and left(regexp_replace(p.phone, '[^0-9]', '', 'g'), 1) = '0'
      then right(regexp_replace(p.phone, '[^0-9]', '', 'g'), 10)
    else regexp_replace(p.phone, '[^0-9]', '', 'g')
  end = v_phone_ten;
  if v_match_count <> 1 then return new; end if;

  for v_identity in
    select i.user_id from public.verified_phone_identities i
    where right(regexp_replace(i.phone_e164, '[^0-9]', '', 'g'), 10) = v_phone_ten
  loop
    if v_identity.user_id = new.user_id then continue; end if;
    insert into public.khata_party_links
      (party_id, shop_owner_id, client_user_id, link_status, consent_status, expires_at)
    select new.id, coalesce(s.owner_id, new.user_id), v_identity.user_id,
      'pending', 'pending', now() + interval '30 days'
    from public.shops s where s.id = new.shop_id
    on conflict do nothing;
    if new.shop_id is null then
      insert into public.khata_party_links
        (party_id, shop_owner_id, client_user_id, link_status, consent_status, expires_at)
      values (new.id, new.user_id, v_identity.user_id, 'pending', 'pending', now() + interval '30 days')
      on conflict do nothing;
    end if;
  end loop;
  return new;
end;
$$;

drop trigger if exists khata_match_new_party_phone_trigger on public.khata_parties;
create trigger khata_match_new_party_phone_trigger
  after insert or update of phone, is_archived on public.khata_parties
  for each row execute function public.khata_match_new_party_phone();