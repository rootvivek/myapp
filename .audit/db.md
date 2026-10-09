# Supabase Schema / RLS / RPC Security Audit (`task_0002`)

**Scope reviewed**
- `/workspace/supabase/schema.sql` (base schema, RLS, triggers, RPCs, storage policies)
- `/workspace/supabase/migrations/20260928_fixes.sql`
- `/workspace/supabase/migrations/20260929_inventory_rls.sql`
- `/workspace/supabase/migrations/20260929_inventory_stock_rpc.sql`
- `/workspace/supabase/migrations/20260929_security_hardening.sql`
- `/workspace/supabase_seller_migration.sql`
- `/workspace/supabase/app_versions_table.sql`
- Client reachability cross-checks: `src/auth/LabourService.ts`, `src/auth/ProfileService.ts`, `src/db/sellerRepository.ts`, `scripts/update-database.sh`, `backend/otp-server.js`

**Model assumed:** clients connect through PostgREST as `anon` / `authenticated` using the public anon key (embedded in the APK, see `src/lib/supabase.ts:30-34`). The anon key can call `/auth/v1/signup` and any granted RPC.

## Findings summary

| # | Severity | Area | File:line | One-line impact |
|---|----------|------|-----------|-----------------|
| 1 | **Critical** | Signup trigger / tenant isolation | `supabase/schema.sql:230-236` | Attacker-chosen `shop_id` in signup metadata joins *any* tenant as `labour`; then reads that tenant's repairs/inventory/profiles/sellers/storage. |
| 2 | **High** | Repairs UPDATE/INSERT policies | `supabase/schema.sql:339-372` | Missing `WITH CHECK`: a labour can relocate/plant repair rows into an arbitrary `shop_id` and forge `created_by`/`user_id`. |
| 3 | **High** | Sellers INSERT policy | `supabase_seller_migration.sql:74-79` | `shop_id` unvalidated on insert → inject seller rows into any tenant's seller list. |
| 4 | **Medium** | Profiles INSERT vs guard trigger | `supabase/schema.sql:109-118, 134-180` | `guard_profile_privileges` is `BEFORE UPDATE` only; a user with no profile row can self-insert as `owner` into any existing shop. |
| 5 | **Low** | SECURITY DEFINER helpers | `supabase/schema.sql:8-29` | `get_user_shop_id(uuid)` / `get_user_role(uuid)` callable by `authenticated` → cross-user info oracle (feeds #1). |
| 6 | **Low** | app_versions drift | `supabase/schema.sql:697-725` vs `supabase/app_versions_table.sql:4-49` | Two conflicting definitions; duplicate/overlapping policies; root files not applied by `update-database.sh`. |
| 7 | **Low** | Storage policy cast | `supabase/schema.sql:381-389` | `(storage.foldername(name))[1]::uuid` throws on non-UUID top folder → policy evaluation error / 500. |

**Correctly hardened (no action):** inventory null-shop leak (`20260929_inventory_rls.sql`), `admin_reset_labour_password` NULL semantics + role checks (`20260929_security_hardening.sql:74-119`), `guard_profile_privileges` UPDATE path, `search_repairs_for_user` and `deduct_inventory_stock` shop/user scoping, `handle_new_user` execute revoked from API roles.

---

## 1. CRITICAL — Signup metadata lets any caller join an arbitrary tenant

**Evidence**
- `supabase/schema.sql:205-269` — `public.handle_new_user()` (SECURITY DEFINER, `AFTER INSERT ON auth.users`).
- `supabase/schema.sql:230-236`:
  ```sql
  if v_role = 'labour' then
    -- Staff never own a shop: attach to the owner's shop from the signup metadata.
    begin
      v_shop_id := nullif(btrim(new.raw_user_meta_data ->> 'shop_id'), '')::uuid;
    exception when others then
      v_shop_id := null;
    end;
  ```
- `supabase/schema.sql:259-262` inserts `public.profiles (id, name, phone, role, shop_id)` with that value.
- Reachable client path: `src/auth/LabourService.ts:27-33` calls `tempClient.auth.signUp({ email, password, options: { data: { role: 'labour', shop_id: ownerProfile.shopId } } })` on the anon client. The DB cannot distinguish an owner-initiated signup from an attacker-initiated one.

**Why it is a vulnerability**
`raw_user_meta_data` is entirely client-controlled at `POST /auth/v1/signup` (no server/DB validation). `shop_id` is used verbatim; the trigger never verifies the shop exists, that the caller owns it, or that the caller is authenticated at all. Because `profiles.shop_id` is the tenant key used by every shop-scoped RLS policy, the resulting profile immediately unlocks the target tenant:

- `repairs_select_shop` — `supabase/schema.sql:329-333` (`shop_id = get_user_shop_id(auth.uid())`)
- `inventory_select_shop` — `supabase/schema.sql:508-512`
- `profiles_select_shop` — `supabase/schema.sql:104-107` (names, phones, usernames, logos)
- `sellers_select_policy` — `supabase_seller_migration.sql:62-71`
- `repair_images_select` — `supabase/schema.sql:381-389` (all repair photos for the shop)
- `shops_select_member` — `supabase/schema.sql:56-59`

**Concrete attack path**
1. Attacker (anonymous, holding only the anon key, or any authenticated labour) calls `POST /auth/v1/signup` with metadata `{ "data": { "role": "labour", "shop_id": "<victim-shop-uuid>" } }` and a password of their choosing.
2. `handle_new_user` creates `profiles(role='labour', shop_id='<victim-shop-uuid>')`.
3. Attacker signs in with that password and issues PostgREST reads (`/rest/v1/repairs?select=*`, `/rest/v1/inventory`, `/rest/v1/profiles`), which now return the victim tenant's rows.

Precondition: the attacker must know the target `shop_id` UUID. This is realistic — it is visible to every current/former staff member, is printed on invoices, and can be harvested via finding #5. The trigger also fails open: a bad value is swallowed by the `exception` handler at `:234-236`, and the profile-insert error is swallowed at `:263-265`, leaving a "no profile" state (see #4) instead of erroring.

**Recommended fix**
Do not derive tenant membership from client metadata. Preferred: create labour accounts only through a `SECURITY DEFINER` RPC (e.g. `create_labour_account(...)`) that resolves the shop from `get_user_shop_id(auth.uid())` after asserting `get_user_role(auth.uid()) = 'owner'`, and creates the user/profile itself, ignoring any client-supplied `shop_id`. If the signup trigger must stay, drop the `shop_id` metadata branch for `labour` and insert the profile with `shop_id = null`, requiring an owner-initiated, RPC-checked attachment afterwards. Validation of `exists(select 1 from shops where id = v_shop_id)` alone is insufficient because an `auth.users` trigger cannot authenticate the initiating caller.

---


## 2. HIGH — `repairs` UPDATE/INSERT policies have no `WITH CHECK`; tenant key is mutable

**Evidence**
- `supabase/schema.sql:339-346` (insert):
  ```sql
  create policy "repairs_insert_shop" on public.repairs
    for insert with check (
      user_id = auth.uid()
      and ( shop_id = public.get_user_shop_id(auth.uid()) or shop_id is null )
    );
  ```
  `created_by` and `user_id`-vs-`shop_id` consistency are not constrained beyond the two clauses above; `created_by` is fully client-settable.
- `supabase/schema.sql:352-359` (update) and `:365-372` (delete):
  ```sql
  create policy "repairs_update_shop" on public.repairs
    for update using (
      created_by = auth.uid()
      or ( shop_id = public.get_user_shop_id(auth.uid())
           and public.get_user_role(auth.uid()) = 'owner' )
    );
  ```
  No `WITH CHECK` is declared. In PostgreSQL the `USING` expression is then reused as the `WITH CHECK` for the **new** row.

**Why it is a vulnerability**
A labour user is the `created_by` of repairs they created, so `created_by = auth.uid()` is true both before and after the update. That makes the policy's check pass for *any* new row values. Consequently a labour can:
- set `shop_id` to an arbitrary tenant UUID (`UPDATE repairs SET shop_id='<victim-shop-uuid>' WHERE id=<own row>`), moving/injecting the row into another tenant's workspace (it becomes visible to that tenant via `repairs_select_shop`, `supabase/schema.sql:329-333`), and
- set `user_id` / `created_by` to arbitrary users, forging attribution.

On insert, a labour can set `created_by` to any user id (e.g. the victim owner's id) because `repairs_insert_shop` never pins `created_by = auth.uid()`. This forges the labour-attribution/earnings logic and the "labour may update only own" rule.

**Recommended fix**
Add explicit `WITH CHECK` clauses mirroring and extending the `USING`, and pin `created_by`:
```sql
drop policy if exists "repairs_update_shop" on public.repairs;
create policy "repairs_update_shop" on public.repairs
  for update using (
    created_by = auth.uid()
    or (shop_id = public.get_user_shop_id(auth.uid())
        and public.get_user_role(auth.uid()) = 'owner')
  )
  with check (
    created_by = auth.uid()
    or (shop_id = public.get_user_shop_id(auth.uid())
        and public.get_user_role(auth.uid()) = 'owner')
  );
```
and for insert require `created_by = auth.uid()` (or `created_by is null`) plus `shop_id is null or shop_id = get_user_shop_id(auth.uid())`.

---

## 3. HIGH — `sellers` INSERT does not validate `shop_id` (cross-tenant injection)

**Evidence** — `supabase_seller_migration.sql:74-79`:
```sql
CREATE POLICY "sellers_insert_policy" ON public.sellers
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND user_id = auth.uid()
  );
```
`shop_id` is never constrained on insert. The client only sends `shop_id: ctx.shopId` (`src/db/sellerRepository.ts:71-81`), but PostgREST accepts any body, so an attacker can send `shop_id: "<victim-shop-uuid>"`.

**Impact**
The row is inserted with the attacker's `user_id`, but `sellers_select_policy` (`supabase_seller_migration.sql:62-71`) exposes any seller whose `shop_id` matches the victim tenant, so the injected seller (including its `phone`) appears in the victim's seller list. The attacker retains `user_id = auth.uid()` and can keep updating it via `sellers_update_policy` (`:82-89`). This is cross-tenant data injection / a phishing vector (attacker-controlled phone shown to the victim shop).

**Recommended fix** — constrain the tenant key on insert:
```sql
CREATE POLICY "sellers_insert_policy" ON public.sellers
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
    AND user_id = auth.uid()
    AND (shop_id IS NULL OR shop_id = public.get_user_shop_id(auth.uid()))
  );
```
Also add a matching `WITH CHECK` to `sellers_update_policy` so `shop_id` cannot be changed afterwards.

---


## 4. MEDIUM — Profile privilege guard is `BEFORE UPDATE` only; INSERT path is unguarded

**Evidence**
- `supabase/schema.sql:109-118` — `profiles_insert_own_or_owner`:
  ```sql
  create policy "profiles_insert_own_or_owner" on public.profiles
    for insert with check (
      id = (select auth.uid())
      or ( (select public.get_user_role((select auth.uid()))) = 'owner'
           and shop_id = (select public.get_user_shop_id((select auth.uid()))) )
    );
  ```
  The self-branch (`id = auth.uid()`) places **no** restriction on `role` or `shop_id`.
- `supabase/schema.sql:134-180` — `guard_profile_privileges()` is attached with
  `create trigger guard_profile_privileges_trigger before update on public.profiles` (`:177-180`). There is no equivalent `BEFORE INSERT` trigger.

**Why it is a vulnerability**
A user with no existing `profiles` row can `INSERT` their own row with `role = 'owner'` and `shop_id = '<any existing shop uuid>'`, obtaining owner privileges and membership in another tenant. The schema explicitly anticipates the "no profile row" state and backfills it (`supabase/schema.sql:538-542`), and `handle_new_user` swallows profile-insert failures (`supabase/schema.sql:263-265`), so the precondition is reachable — not merely theoretical. A `profiles` row is keyed by `id = auth.uid()`, so this cannot be used by a user who already has one; there is no self-delete policy, which limits, but does not eliminate, exposure.

**Recommended fix** — add a `BEFORE INSERT` guard mirroring `guard_profile_privileges`, and tighten the insert policy so the self-branch may only create `role = 'owner'` with a shop the actor owns (or `shop_id is null`):
```sql
create or replace function public.guard_profile_privileges_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_actor_role text;
begin
  if auth.uid() is null then return new; end if;
  select role into v_actor_role from public.profiles where id = auth.uid();
  if v_actor_role is distinct from 'owner' then
    if new.role is distinct from 'owner' and new.role is distinct from 'labour' then
      raise exception 'invalid role';
    end if;
    if new.shop_id is not null then
      raise exception 'Only owners can assign a shop';
    end if;
  end if;
  return new;
end $$;
create trigger guard_profile_privileges_insert_trigger
  before insert on public.profiles
  for each row execute function public.guard_profile_privileges_insert();
```

---

## 5. LOW — `get_user_shop_id(uuid)` / `get_user_role(uuid)` are callable cross-user oracles

**Evidence** — `supabase/schema.sql:8-29`:
```sql
create or replace function public.get_user_shop_id(p_user_id uuid) ... security definer ...
grant execute on function public.get_user_shop_id(uuid) to authenticated;
grant execute on function public.get_user_role(uuid) to authenticated;
```
Both accept an arbitrary `p_user_id` and are exposed via PostgREST, so any authenticated user can call
`supabase.rpc('get_user_shop_id', { p_user_id: '<uuid>' })` / `get_user_role` and read another user's tenant id and role.

**Impact** — cross-user information disclosure; notably it is the easiest way to harvest the target `shop_id` needed to weaponise finding #1.

**Recommended fix** — the helpers are only ever invoked with the caller's own id in the table policies (`supabase/schema.sql:58,106,332,343,356,369`), but the storage policy legitimately needs an arbitrary id (`supabase/schema.sql:387`). Introduce a private, non-granted variant for the storage policy and restrict the public helpers with `and p_user_id = auth.uid()` (plus an escape for `service_role`), or revoke `execute` from `authenticated` and inline the reads. Verify the storage `repair_images_select` policy still functions after the change.

---


## 6. LOW — `app_versions` is defined twice with conflicting schema and policies

**Evidence**
- `supabase/schema.sql:697-725`: `id serial`, `version_code integer not null` (no unique), policies `Allow public select` (`using (true)`) plus explicit deny-all insert/update/delete (`with check (false)` / `using (false)`).
- `supabase/app_versions_table.sql:4-49`: `id bigserial`, `version_code int not null unique`, policy `Public read app versions` plus `Service role manage app versions for all using (auth.role() = 'service_role')`, and grants `select` to `anon, authenticated`.

**Impact** — both files use `create table if not exists`, so whichever executes first fixes the column types/constraints; the second is silently a no-op for the table. Both `SELECT` policies are permissive and OR'd, and the deny policies coexist with the `service_role` policy. The result is environment-dependent schema/policy drift (e.g. `version_code` uniqueness and `updated_at` differ) — a correctness/review hazard rather than a direct exploit. Additionally, `scripts/update-database.sh` applies only `supabase/migrations/*.sql`; the root-level `schema.sql`, `supabase_seller_migration.sql`, and `app_versions_table.sql` are applied manually, so RLS can be absent/stale in environments that only run the script.

**Recommended fix** — keep a single canonical definition; delete the duplicate block, move it into `supabase/migrations/` so `update-database.sh` applies it, and confirm RLS is enabled with a `select`-only policy before granting `select` to `anon`.

---

## 7. LOW — Storage select policy casts folder names to `uuid` unsafely

**Evidence** — `supabase/schema.sql:381-389`:
```sql
create policy "repair_images_select" on storage.objects
  for select using (
    bucket_id = 'repair-images'
    and ( (storage.foldername(name))[1] = auth.uid()::text
          or public.get_user_shop_id(auth.uid())
             = public.get_user_shop_id((storage.foldername(name))[1]::uuid) )
  );
```
If an object in the `repair-images` bucket has a top-level folder that is not a valid UUID (e.g. one written by `service_role` tooling or a manual upload), the `::uuid` cast raises `invalid input syntax for type uuid` during policy evaluation, aborting the whole query/listing rather than simply excluding the row.

**Impact** — denial of legitimate listings / PostgREST 500s for the bucket; not a confidentiality issue. The `insert/update/delete` policies correctly pin the first folder to `auth.uid()::text` (`:391-410`), so uploads remain scoped.

**Recommended fix** — guard the cast:
```sql
and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
and public.get_user_shop_id(auth.uid())
    = public.get_user_shop_id((storage.foldername(name))[1]::uuid)
```

---


## Verified as correctly hardened (no action required)

- **Inventory null-shop leak fixed.** `supabase/migrations/20260929_inventory_rls.sql:25-63` replaces the old `get_user_shop_id(auth.uid()) is null or shop_id = ...` policy. The `shop_id is not null and shop_id = get_user_shop_id(...)` form means a shop-less user matches only their own `user_id` rows; `NULL = NULL` is not true, so there is no cross-tenant branch. `supabase/schema.sql:508-536` carries the same hardened form.
- **`admin_reset_labour_password` NULL semantics correct.** `supabase/schema.sql:641-692` / `20260929_security_hardening.sql:74-119` require caller `role = 'owner'` (`:659`), reject a NULL caller shop (`:663`), require the target to be `labour` (`:672`), and compare shops with `is distinct from` (`:677`) so two NULL shops do not match.
- **`guard_profile_privileges` blocks the UPDATE escalation.** `supabase/schema.sql:134-180` rejects role/shop changes by non-owners and prevents moving a profile into a shop the actor does not own.
- **`search_repairs_for_user` is scoped.** `supabase/schema.sql:442-479` is `SECURITY DEFINER` but filters `r.shop_id = public.get_user_shop_id(auth.uid())`; wildcard stripping prevents pattern abuse, and a shop-less caller gets zero rows.
- **`deduct_inventory_stock` is scoped and atomic.** `supabase/migrations/20260929_inventory_stock_rpc.sql:12-40` restricts the update to `i.user_id = auth.uid() or i.shop_id = get_user_shop_id(auth.uid())` in one statement (no lost-update race). Minor robustness note: it returns `NULL` (not an error) when no row matches, and the client ignores the return value (`src/db/inventoryRepository.ts:119-123`) — worth surfacing an error, but not a security defect.
- **`handle_new_user` is not directly callable.** `supabase/schema.sql:278` revokes execute from `public, anon, authenticated`.
- **`repair-images` bucket is private** (`supabase/schema.sql:374-377`, `public = false`); `shop-logos` is intentionally public (`:412-414`) for logos.
- **`shops` policies are sound.** `shops_update_owner` (`:71-73`) has no explicit `WITH CHECK` but defaults to the `USING` expression, so `owner_id` cannot be reassigned; there is no delete policy (default deny).

## Notes / limitations

- Supabase project-level settings (whether email/password signup is enabled, email confirmation, JWT role claim) were not verifiable from the repository. Finding #1 assumes the standard anon signup endpoint is reachable, which the client's own `tempClient.auth.signUp` usage (`src/auth/LabourService.ts:27`) requires.
- No live database was available; policy behaviour is reasoned from the SQL text and PostgreSQL/PostgREST semantics (`USING` reused as `WITH CHECK` when omitted; permissive policies OR'd; RLS default-deny when no policy matches).

