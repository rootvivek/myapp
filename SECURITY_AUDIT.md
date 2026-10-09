# Security & Bug Audit — `myapp` (MCA Phone Wala)

**Audited commit:** `453c276` (`main`)
**Scope:** React Native client (`src/`), Node/Express OTP + auto-update backend (`backend/`), Supabase schema / RLS / RPCs (`supabase/`, `supabase_seller_migration.sql`), build/deploy scripts.
**Method:** parallel static review by four specialist reviewers, then **every High/Critical finding was independently re-verified by the lead** against the source (SQL semantics, JS logic reproduction, grep evidence). Verification status is stated per finding. Detailed per-area evidence lives in `.audit/backend.md`, `.audit/db.md`, `.audit/auth.md`, `.audit/client.md`.

> Legend: **CRIT** = critical, **HIGH**, **MED**, **LOW**. "✔ verified" = lead re-checked the exact code/claim.

---

## Executive summary

The codebase has clearly received prior security hardening (RLS recursion helpers, inventory null-shop fix, `guard_profile_privileges`, `admin_reset_labour_password` NULL fix, private image bucket). However, several **foundational trust-boundary mistakes remain**: the app trusts client-controlled data (`user_metadata`, request bodies, deep links) for identity and tenancy, and two security controls are non-functional (OTP brute-force lockout and inventory auto-deduction).

**Most urgent (fix first):**

1. **CRIT — Signup metadata grants membership to any tenant.** `handle_new_user()` attaches a self-registered "labour" account to an attacker-chosen `shop_id`.
2. **HIGH — Phone OTP is not enforced.** Account creation is never bound to a verified OTP; OTP is a client-side UI gate only.
3. **HIGH — OTP brute-force lockout is dead code** (JS `Date.now() > null` bug) — every `/api/verify-otp` attempt after the first is allowed.
4. **HIGH — `repairs` UPDATE policy is bypassable** (no effective `WITH CHECK` + client-settable `created_by`) → cross-tenant row relocation.
5. **HIGH — `sellers` INSERT does not validate `shop_id`** → cross-tenant data injection.
6. **HIGH — Privilege/role derived from client-writable `user_metadata`**; a missing profile is recreated as `owner`.
7. **HIGH — Inventory stock auto-deduction is dead code** (the selection field is never populated), so stock silently never decrements.

---

## Findings by severity

| # | Sev | Area | Location | Issue |
|---|-----|------|----------|-------|
| 1 | CRIT | DB/RLS | `supabase/schema.sql:230-236` | Signup metadata `shop_id` lets any caller join an arbitrary tenant |
| 2 | HIGH | Client auth | `src/auth/AuthService.ts:249`, `AuthScreen.tsx:269-323` | OTP not enforced server-side; registration bypasses phone verification |
| 3 | HIGH | Backend | `backend/otp-server.js:129-140` | OTP lockout never triggers (`Date.now() > null`) |
| 4 | HIGH | DB/RLS | `supabase/schema.sql:352-359` | `repairs` UPDATE lacks effective `WITH CHECK`; `created_by` forgeable |
| 5 | HIGH | DB/RLS | `supabase_seller_migration.sql:74-79` | `sellers` INSERT does not constrain `shop_id` (cross-tenant injection) |
| 6 | HIGH | Client auth | `src/auth/ProfileService.ts:139,198-207` | Role from client-writable `user_metadata`; missing profile → `owner` |
| 7 | HIGH | Client data | `src/screens/AddRepair/hooks/useRepairSave.ts:151` | `selectedInventoryItemIds` never assigned → stock deduction dead code |
| 8 | MED | Backend | `backend/otp-server.js:294-307` | `/api/signup-with-otp` checks OTP with no lockout/attempt tracking |
| 9 | MED | Backend | `backend/otp-server.js:62-86,180-183` | Rate limit per-IP only, in-memory; no per-phone throttle on send-otp (SMS fraud) |
| 10 | MED | Backend | `backend/otp-server.js:13` | `trust proxy` hard-coded to `1` → `req.ip` spoofable in other topologies |
| 11 | MED | DB/RLS | `supabase/schema.sql:109-118,134-180` | Profile privilege guard is `BEFORE UPDATE` only; INSERT path unguarded |
| 12 | MED | DB/RLS | `supabase/schema.sql:8-29` | `get_user_shop_id`/`get_user_role` callable cross-user (info oracle) |
| 13 | MED | Client auth | `src/auth/AuthProvider.tsx:190` | `isOwner` fails open (`true`) when profile is missing |
| 14 | MED | Client auth | `App.tsx:52-62`, `src/auth/deepLink.ts:43-78` | Deep link accepts auth tokens from any URL → session injection |
| 15 | MED | Client auth | `src/lib/supabaseAuthStorage.ts:10-23` | Supabase access/refresh tokens stored unencrypted (AsyncStorage) |
| 16 | MED | Client data | `src/services/autoUpdate.ts:192,271-389` | APK auto-update has no integrity check; cleartext possible |
| 17 | MED | Client UI | `src/screens/FinanceScreen.tsx:217-221` | Jobs with `advance >= cost && !isPaid` vanish from both Finance lists |
| 18 | MED | Client data | `src/context/RepairsContext.tsx:101-122`, `InventoryContext.tsx:95-121` | Realtime subscriptions have no filter/ownership re-check |
| 19 | MED | Client data | `src/utils/format.ts:20-27` | `parseMoney` silently corrupts mistyped amounts (feeds money totals) |
| 20 | MED | Client data | `src/utils/shopSettings.ts:5-40,196-198` | Branding cache shared across accounts; not cleared on sign-out |
| 21 | LOW | Build | `supabase_seller_migration.sql:1` | File begins with a stray backtick → migration is invalid SQL and fails |
| 22 | LOW | Client util | `src/utils/receipt.ts:35-41` | `escapeHtml` is a no-op (replaces chars with themselves); dead code |
| 23 | LOW | Backend | `backend/otp-server.js:190-221` | OTP stays valid after a failed MSG91 send |
| 24 | LOW | Backend | `backend/otp-server.js:266,305` | Non-constant-time OTP comparison |
| 25 | LOW | Backend | `backend/otp-server.js:17` | `ALLOWED_ORIGINS` defaults to `*` |
| 26 | LOW | Backend | `backend/otp-server.js:114-123,331-333` | Account-existence enumeration via distinct signup error |
| 27 | LOW | Backend | `backend/otp-server.js:318-379` | Signup not transactional → orphaned auth user |
| 28 | LOW | DB/RLS | `supabase/schema.sql:381-389` | Storage select policy casts folder name to `uuid` unsafely |
| 29 | LOW | DB/RLS | `supabase/schema.sql:697-725` vs `app_versions_table.sql` | `app_versions` defined twice with conflicting schema/policies |
| 30 | LOW | Client UI | `src/utils/receipt.ts:370-384`, `ScanQrScreen.tsx:172` | Invoice "barcode" is random; scanner can never resolve it |
| 31 | LOW | Client data | `src/utils/receipt.ts:142-161` | Invoice PDFs persist in app storage indefinitely |
| 32 | LOW | Client data | `src/utils/receipt.ts:61-77` | `readUriAsBase64` fetches any http(s) logo URL (no host/size guard) |
| 33 | LOW | Client data | `src/utils/shopSettings.ts:16` | Real shop phone number hardcoded in the bundle |
| 34 | LOW | Client auth | `src/screens/AuthScreen.tsx:311` | Weak password policy (min 6); owner-set labour passwords |
| 35 | LOW | Client data | `src/db/profileRepository.ts:55-65` | Deleting labour removes only the profile row, not the auth user (rejoin risk) |
| 36 | LOW | Client data | `src/db/sellerRepository.ts:63` | `ilike` duplicate check treats `%`/`_` in names as wildcards |
| 37 | LOW | Client auth | `src/services/msg91Service.ts:7,55,82` | MSG91 `requestId` is a module global, not bound to the phone |
| 38 | LOW | Client auth | `src/auth/AuthService.ts:128` | Unconditional `signOut()` on every sign-in attempt |

---

## Critical & High — detail

### 1. CRIT — Signup metadata lets any caller join an arbitrary tenant ✔ verified
**Where:** `supabase/schema.sql:230-236` (trigger `handle_new_user`), reachable via the public Supabase signup endpoint; client precedent `src/auth/LabourService.ts:27-33`.

```sql
if v_role = 'labour' then
  v_shop_id := nullif(btrim(new.raw_user_meta_data ->> 'shop_id'), '')::uuid;
```
`raw_user_meta_data` is entirely client-controlled at `POST /auth/v1/signup`. The trigger uses `shop_id` verbatim and never verifies the caller owns it (an `auth.users` trigger cannot authenticate the caller). Because `profiles.shop_id` is the tenant key for **every** shop-scoped policy, the resulting profile immediately unlocks the target tenant: `repairs`, `inventory`, `profiles` (names/phones/usernames), `sellers`, `shops`, and the `repair-images` bucket.

**Attack:** an anonymous caller (anon key, embedded in the APK) signs up with metadata `{"data":{"role":"labour","shop_id":"<victim-shop-uuid>"}}`, then reads the victim's tables via PostgREST. Precondition: knowing the target `shop_id` UUID — visible to current/former staff, and harvestable via finding #12.

**Fix:** never derive tenancy from client metadata. Create labour accounts through a `SECURITY DEFINER` RPC that resolves the shop from `get_user_shop_id(auth.uid())` after asserting `get_user_role(auth.uid()) = 'owner'`. If the trigger stays, drop the `shop_id` branch and insert `shop_id = null`.

---

### 2. HIGH — Phone OTP is not enforced; registration bypasses verification ✔ verified
**Where:** `src/auth/AuthService.ts:249` (`signUpUser` → `supabase.auth.signUp`), UI gate only at `src/screens/AuthScreen.tsx:269-297`, `src/services/msg91Service.ts:71-89`.

The MSG91 OTP is verified **locally in the app**; the result never reaches Supabase or the backend. `signUpUser()` creates the account with `email = <phone>@msg91.local` and a chosen password — no OTP, token, or proof of phone ownership. The backend's `/api/signup-with-otp` (which *does* verify server-side) is **never called by the client** (grep confirms no reference).

**Impact:** an attacker can POST directly to `/auth/v1/signup` and register any 10-digit phone number without receiving an SMS → phone-number **squatting / denial of registration** (the real owner's later signup maps to the same alias and is rejected as "already registered"), and impersonation of unregistered numbers.

**Fix:** make phone-ownership proof server-side — send/verify OTP on the app backend, then create the user there (service role) or issue a signed one-time token the signup RPC validates. Do not treat `signupStep` client state as a security boundary.

---

### 3. HIGH — OTP brute-force lockout is dead code ✔ verified (reproduced)
**Where:** `backend/otp-server.js:129-140`.

```js
if (Date.now() > entry.lockedUntil) { otpAttempts.delete(phone); return { allowed: true }; }
```
`entry.lockedUntil` is `null` until the counter reaches `MAX_OTP_ATTEMPTS`. In JS `Date.now() > null` coerces `null` to `0` and is **always true**, so every attempt after the first deletes the entry and is allowed — the counter never accumulates and the 15-minute lockout never fires. Reproduced locally: 10/10 wrong-OTP checks returned `allowed=true`; the store entry stayed deleted.

**Fix:** check `entry.lockedUntil != null && Date.now() > entry.lockedUntil`, and only treat a lockout as expired when `lockedUntil` is set.

---

### 4. HIGH — `repairs` UPDATE policy has no effective `WITH CHECK`; `created_by` forgeable ✔ verified
**Where:** `supabase/schema.sql:339-372`.

`repairs_update_shop` declares only `USING (created_by = auth.uid() OR (shop_id = get_user_shop_id(...) AND role='owner'))`. With no `WITH CHECK`, PostgreSQL reuses the `USING` expression for the **new** row. A labour is `created_by` of their own repairs, so `created_by = auth.uid()` remains true for *any* new values → a labour can `UPDATE repairs SET shop_id='<victim-shop-uuid>'` and relocate/plant a row into another tenant (visible to that tenant via `repairs_select_shop`), or set `user_id`/`created_by` to arbitrary users. On insert, `created_by` is never pinned to `auth.uid()` (`:339-346`).

**Fix:** add explicit `WITH CHECK` mirroring the `USING`, and pin `created_by = auth.uid()` (or `created_by IS NULL`) on insert/update.

---

### 5. HIGH — `sellers` INSERT does not validate `shop_id` ✔ verified
**Where:** `supabase_seller_migration.sql:74-79`.

```sql
CREATE POLICY "sellers_insert_policy" ON public.sellers
  FOR INSERT WITH CHECK (created_by = auth.uid() AND user_id = auth.uid());
```
`shop_id` is unconstrained. PostgREST accepts any body, so any authenticated user can insert a seller with `shop_id = <victim-shop-uuid>`; `sellers_select_policy` then exposes it (including its `phone`) in the victim's seller list — cross-tenant injection / phishing vector.

**Fix:** add `AND (shop_id IS NULL OR shop_id = public.get_user_shop_id(auth.uid()))`, and add a `WITH CHECK` to `sellers_update_policy` so `shop_id` can't be changed afterwards.

---

### 6. HIGH — Role derived from client-writable `user_metadata`; missing profile recreated as `owner` ✔ verified
**Where:** `src/auth/ProfileService.ts:139,198-207` (and `:179`).

```ts
const isLabourAccount = userMetaRole === 'labour';
... role: isLabourAccount ? 'labour' : 'owner',
```
`user_metadata` is writable by the account holder (`supabase.auth.updateUser({data:{...}})`). If a labour's `profiles` row is absent — a state the code explicitly self-heals (`ProfileService.ts:195-197`) and that arises when an owner removes staff or a row was never created — the staff member can set `user_metadata.role='owner'` and have `ensureOwnerProfile` create a `profiles` row as **owner**. The server INSERT policy (`schema.sql:109-118`, self-branch) does not constrain `role`, and `guard_profile_privileges` fires `BEFORE UPDATE` only.

**Fix:** never derive authorization from `user_metadata`; set role/shop server-side only, add a `BEFORE INSERT` guard, and constrain the self-insert policy (see #11).

---

### 7. HIGH — Inventory stock auto-deduction is dead code ✔ verified
**Where:** `src/screens/AddRepair/hooks/useRepairSave.ts:150-154`.

```ts
const inventoryIds = Array.from(new Set(state.selectedInventoryItemIds ?? []));
for (const invId of inventoryIds) await deductInventoryStock(invId, 1);
```
`selectedInventoryItemIds` is **never assigned anywhere** (grep: only the type declaration, the reducer's initial `[]`, and this read). So attached parts never decrement `inventory.stock_count`, and the advertised "Live stock count with auto deduction" is false. Additionally, the loop sits outside the create/edit branch, so once a picker is wired an edit would re-deduct every part (and delete never restores stock); deduction errors are swallowed (`inventoryRepository.ts:128-137`).

**Fix:** wire the inventory picker, persist the selection on edit, deduct only the delta, restore on removal/delete, and surface deduction failures.

---

## Medium — quick notes (full evidence in `.audit/*.md`)

- **#8 `/api/signup-with-otp`** (`otp-server.js:294-307`): verifies `entry.otp` with **no** `checkOtpAttempts`/`recordOtpAttempt` — brute-forceable (subject only to the per-IP 5/min limit). Add the same lockout used by `/api/verify-otp`.
- **#9 Rate limiting** (`otp-server.js:62-86,180-183`): per-IP only and in-memory (resets on restart, not shared across instances). No per-phone throttle on `/api/send-otp` → SMS toll fraud / OTP bombing. Add per-phone throttling and a shared store (Redis).
- **#10 `trust proxy`** (`otp-server.js:13`): `1` is only safe with exactly one appending proxy. Behind Cloudflare→Render or a direct VPS, `req.ip` is attacker-controlled via `X-Forwarded-For`, bypassing all rate limits. Pin to the real topology.
- **#11 Profile INSERT** (`schema.sql:109-118`): the self-branch allows inserting your own row with any `role`/`shop_id`; the guard trigger is `BEFORE UPDATE` only. Precondition: no existing profile row. Add a `BEFORE INSERT` guard + constrain the policy.
- **#12 Helper oracle** (`schema.sql:8-29`): `get_user_shop_id(uuid)`/`get_user_role(uuid)` are granted to `authenticated` and accept arbitrary ids → any user can read another user's shop id/role; this is the easiest way to harvest the `shop_id` needed for #1.
- **#13 `isOwner` fails open** (`AuthProvider.tsx:190`): `state.profile?.role ? ... : true` makes a missing profile an owner. Default to least privilege.
- **#14 Deep link** (`App.tsx:52-62`, `deepLink.ts`): any URL passed to `handleAuthDeepLink` is accepted; the implicit-flow `access_token`/`refresh_token` branch (from query *or* fragment) calls `setSession`. A crafted `myapp://…?access_token=…&refresh_token=…` makes the victim's app adopt the attacker's session. Validate scheme/host/path and prefer PKCE-only.
- **#15 Token storage** (`supabaseAuthStorage.ts`): access/refresh tokens in plain `AsyncStorage`. Use Keychain/Keystore and disable Android backup.
- **#16 APK update** (`autoUpdate.ts`): download URL is neither hashed nor signature-verified, and cleartext HTTP is possible. Require `https`, publish a SHA-256, verify before install. (Note: `android/` is gitignored so cleartext config can't be confirmed from the repo.)
- **#17 Finance bucketing** (`FinanceScreen.tsx:217-221`): a job with `!isPaid && advance >= cost` lands in neither `dues` nor `paid`, while its advance is still added to `totalPaid`. Classify strictly by `isPaid`.
- **#18 Realtime** (`RepairsContext.tsx`, `InventoryContext.tsx`): `postgres_changes` subscriptions have no `filter` and apply delivered rows without re-checking `shop_id`/`user_id`; isolation depends entirely on RLS. Add a server filter and defensive tenant re-check.
- **#19 `parseMoney`** (`format.ts:20-27`): strips non-`[0-9.]` then `parseFloat`, so `"5-10"→510`, `"1.2.3"→1.2`, `"1e3"→13`. Validate strictly; show an error.
- **#20 Branding cache** (`shopSettings.ts`): a shared base key plus no clear on sign-out can print the previous account's shop name/phone/logo on an invoice. Scope per account and clear on sign-out.

---

## Verified as correctly handled (no action)
- Inventory null-shop RLS leak is fixed (`20260929_inventory_rls.sql`); `NULL = NULL` cannot match.
- `admin_reset_labour_password` role/NULL checks are correct (`is distinct from`).
- `guard_profile_privileges` blocks the UPDATE escalation path.
- `search_repairs_for_user` and `deduct_inventory_stock` are shop/user scoped.
- `handle_new_user` execute is revoked from API roles; the service-role key stays server-side.
- `repair-images` bucket is private; `SecureImage` signs URLs (so stored public URLs aren't actually readable).
- PDF text is sanitized by `pdfSafe`; no live PDF/HTML text injection.
- Repair search input is stripped of PostgREST metacharacters; phone/WhatsApp URLs are normalized/encoded.

## Suggested remediation order
1. #1, #6, #11 (tenancy/privilege trust boundaries — server-side enforcement).
2. #2, #3, #8, #9 (OTP verification + brute-force/SMS-abuse controls).
3. #4, #5 (RLS `WITH CHECK` / tenant-key validation).
4. #7, #17, #19 (data-correctness bugs affecting stock/money).
5. #13, #14, #15 (client auth hardening).
6. Remaining Medium/Low.
