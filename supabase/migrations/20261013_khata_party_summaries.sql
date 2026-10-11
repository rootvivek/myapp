-- Summaries avoid downloading all transaction notes just to render the party
-- list. Balances remain computed from the authoritative ledger on every read.
create or replace function public.khata_list_party_summaries(p_archived boolean default false)
returns table (
  id uuid,
  name text,
  phone text,
  party_type text,
  notes text,
  is_archived boolean,
  balance_paise bigint,
  transaction_count bigint,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public
as $$
  select p.id, p.name, p.phone, p.party_type, p.notes, p.is_archived,
    coalesce(sum(
      case
        when t.transaction_type in ('purchase', 'payment_received') then t.amount_paise
        when t.transaction_type in ('sale', 'payment_given') then -t.amount_paise
        when t.transaction_type in ('opening_balance', 'adjustment') then
          case when lower(btrim(t.note)) like 'decrease:%' then -t.amount_paise else t.amount_paise end
        else 0
      end
    ), 0)::bigint as balance_paise,
    count(t.id)::bigint as transaction_count,
    p.created_at, p.updated_at
  from public.khata_parties p
  left join public.khata_transactions t on t.party_id = p.id
    and (
      t.user_id = auth.uid()
      or (t.shop_id is not null and t.shop_id = public.get_user_shop_id(auth.uid()))
    )
  where p.is_archived = p_archived
    and (
      p.user_id = auth.uid()
      or (p.shop_id is not null and p.shop_id = public.get_user_shop_id(auth.uid()))
    )
  group by p.id
  order by p.created_at desc;
$$;

revoke all on function public.khata_list_party_summaries(boolean) from public, anon;
grant execute on function public.khata_list_party_summaries(boolean) to authenticated;