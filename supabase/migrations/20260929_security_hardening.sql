-- ═══════════════════════════════════════════════════════════════════
-- Database Migration: 2026-09-29 — profile privilege hardening
--
-- Fix 1: a user could escalate their own `profiles.role` to 'owner'
--        and/or point `profiles.shop_id` at any shop. The app trusts
--        that role for owner-only actions, and RLS uses shop_id for
--        tenant isolation, so this was a privilege-escalation hole.
--
-- Fix 2: admin_reset_labour_password() compared shop ids with `!=`,
--        which does not fire when both sides are NULL (a shop-less
--        owner could reset any shop-less account) and never checked
--        that the target was actually a labour account.
-- ═══════════════════════════════════════════════════════════════════

-- ── Fix 1: only owners may change a profile's role / shop ───────────

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_actor_role text;
  v_actor_shop_id uuid;
begin
  -- Backend (service_role), SECURITY DEFINER triggers and maintenance
  -- scripts run without a JWT and are trusted.
  if v_actor is null then
    return new;
  end if;

  -- Nothing privileged changed: a user may always edit their own name,
  -- phone, username or logo.
  if new.role is not distinct from old.role
     and new.shop_id is not distinct from old.shop_id then
    return new;
  end if;

  select role, shop_id into v_actor_role, v_actor_shop_id
  from public.profiles
  where id = v_actor;

  if v_actor_role is distinct from 'owner' then
    raise exception 'Only owners can change a profile role or shop';
  end if;

  -- An owner may manage profiles in their own shop. Setting shop_id to a
  -- shop they own is allowed too (account-recovery path when the profile
  -- existed before the shop was created).
  if new.shop_id is not null
     and new.shop_id is distinct from v_actor_shop_id
     and not exists (
       select 1 from public.shops s
       where s.id = new.shop_id and s.owner_id = v_actor
     )
  then
    raise exception 'Cannot move a profile to a shop you do not own';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileges_trigger on public.profiles;
create trigger guard_profile_privileges_trigger
  before update on public.profiles
  for each row
  execute function public.guard_profile_privileges();

-- ── Fix 2: safe admin_reset_labour_password ─────────────────────────

create or replace function public.admin_reset_labour_password(p_labour_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_caller_role text;
  v_caller_shop_id uuid;
  v_labour_role text;
  v_labour_shop_id uuid;
begin
  select role, shop_id into v_caller_role, v_caller_shop_id
  from public.profiles
  where id = auth.uid();

  if v_caller_role is distinct from 'owner' then
    raise exception 'Only owners can reset labour passwords';
  end if;

  if v_caller_shop_id is null then
    raise exception 'Your account is not linked to a shop';
  end if;

  select role, shop_id into v_labour_role, v_labour_shop_id
  from public.profiles
  where id = p_labour_id;

  if v_labour_role is distinct from 'labour' then
    raise exception 'Only labour accounts can be reset with this action';
  end if;

  -- `is distinct from` (not `!=`) so a NULL shop on either side is rejected.
  if v_labour_shop_id is distinct from v_caller_shop_id then
    raise exception 'Labour user does not belong to your shop';
  end if;

  if coalesce(length(p_new_password), 0) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  update auth.users
  set encrypted_password = crypt(p_new_password, gen_salt('bf'))
  where id = p_labour_id;
end;
$$;

grant execute on function public.admin_reset_labour_password(uuid, text) to authenticated;
