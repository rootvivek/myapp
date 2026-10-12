-- Signup metadata is caller-controlled and must never assign an authorization
-- role or tenant. Only a trusted Auth Admin operation may set app_metadata.
-- New public signups always become owners of a newly-created shop; provisioned
-- labour accounts use the server-set app_metadata role/shop_id.

-- A prior migration/schema attempted to replace this FK with a reference to
-- auth.users, but aborted when the database already contained orphaned shops.
-- Reapply it NOT VALID: PostgreSQL enforces new writes while allowing those
-- existing records to be audited and repaired separately.
alter table public.shops drop constraint if exists shops_owner_id_fkey;
alter table public.shops add constraint shops_owner_id_fkey
  foreign key (owner_id) references auth.users (id) on delete cascade not valid;

-- Promote existing profile role/shop claims into trusted Auth metadata before
-- recovery starts relying on those claims. This also ensures owner JWTs have
-- explicit role/shop claims after their next token refresh.
update auth.users u
  set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', p.role, 'shop_id', p.shop_id::text)
from public.profiles p
where p.id = u.id
  and p.role in ('owner', 'labour')
  and (
    u.raw_app_meta_data ->> 'role' is distinct from p.role
    or u.raw_app_meta_data ->> 'shop_id' is distinct from p.shop_id::text
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role text := 'owner';
  v_name text;
  v_phone text;
  v_shop_name text;
  v_shop_id uuid;
begin
  if new.raw_app_meta_data ->> 'role' = 'labour' then
    begin
      v_shop_id := nullif(btrim(new.raw_app_meta_data ->> 'shop_id'), '')::uuid;
    exception when others then
      v_shop_id := null;
    end;

    -- Do not attach a staff account to a shop unless the trusted metadata
    -- names an existing shop not owned by the new account.
    if v_shop_id is not null and exists (
      select 1 from public.shops s
      where s.id = v_shop_id and s.owner_id <> new.id
    ) then
      v_role := 'labour';
    else
      v_shop_id := null;
    end if;
  end if;

  v_name := coalesce(btrim(new.raw_user_meta_data ->> 'name'), '');
  v_phone := coalesce(btrim(new.raw_user_meta_data ->> 'phone'), '');
  v_shop_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'shop_name'), ''),
    'MCA Phone Wala'
  );

  if v_role = 'owner' then
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

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Self-profile recovery inserts may create an owner profile or, for a trusted
-- staff JWT only, a labour profile matching its app_metadata claims. Client
-- owner writes cannot provision staff; the authenticated server endpoint does.
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_insert_own_or_owner" on public.profiles;
drop policy if exists "profiles_insert_owner_staff" on public.profiles;
create policy "profiles_insert_own_or_owner" on public.profiles
  for insert with check (
    id = (select auth.uid())
    and (
      (
        role = 'owner'
        and coalesce((select auth.jwt() -> 'app_metadata' ->> 'role'), 'owner') = 'owner'
        and (
          shop_id is null
          or exists (
            select 1 from public.shops s
            where s.id = public.profiles.shop_id
              and s.owner_id = (select auth.uid())
          )
        )
      )
      or (
        role = 'labour'
        and (select auth.jwt() -> 'app_metadata' ->> 'role') = 'labour'
        and shop_id::text = (select auth.jwt() -> 'app_metadata' ->> 'shop_id')
      )
    )
  );