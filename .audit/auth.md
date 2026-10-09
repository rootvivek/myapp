# Client Auth & Session Security Audit — task_0003

**Reviewer:** auth-reviewer
**Scope:** `/workspace/src/auth/*`, `/workspace/src/lib/supabase.ts`,
`/workspace/src/lib/supabaseAuthStorage.ts`, `/workspace/src/services/msg91Service.ts`,
deep-link wiring (`App.tsx`), and the auth UI that drives them (`src/screens/AuthScreen.tsx`).
DB/RLS policies are referenced only where they are the enabling factor for a client-side finding
(owned by task_0002).
**Method:** static review of the committed code at `453c276`. Every finding cites file+line and
states the concrete preconditions. No speculation; items I could not confirm from code are omitted.

Severity legend: **Critical** > **High** > **Medium** > **Low**.

---

## Summary

| # | Severity | Area | One-line |
|---|----------|------|----------|
| 1 | **High** | OTP | Phone OTP is a client-side UI gate only; account creation is never bound to a verified OTP |
| 2 | **High** | Privilege | Account role is derived from client-controlled `user_metadata`; a missing profile row is recreated as `owner` |
| 3 | **Medium** | Privilege | `isOwner` fails open (`true`) whenever the profile is missing/unloaded |
| 4 | **Medium** | Deep link | `handleAuthDeepLink` accepts tokens/codes from any URL → session injection / account confusion |
| 5 | **Medium** | Storage | Supabase access + refresh tokens stored unencrypted in AsyncStorage |
| 6 | **Low** | Enumeration | Distinct error messages disclose whether a phone/email account exists |
| 7 | **Low** | OTP | MSG91 `requestId` is a shared module global; OTP is not bound to the phone being registered |
| 8 | **Low** | Credentials | Weak password policy; owner-set labour passwords with no forced change |
| 9 | **Low** | Logic | Global `signOut()` on every sign-in attempt; labour alias derived from truncated shop UUID |

---

## F1 — Phone OTP is not enforced by the backend; account creation bypasses verification  [High]

**Evidence**
- `src/screens/AuthScreen.tsx:269-297` — the OTP step only calls `verifyOtp(otp)` and, on success,
  flips local React state `setSignupStep('details')`. The account is then created by
  `signUp(...)` at `src/screens/AuthScreen.tsx:318-323`.
- `src/auth/AuthService.ts:230-348` — `signUpUser()` calls `supabase.auth.signUp({ email: <phone>@msg91.local, password, ... })`
  (line 249). It receives only phone, password and profile fields — **no OTP, no verification
  token, and no proof of phone ownership**. The `verifyOtp` result is never passed to or checked by
  Supabase or the app backend.
- `src/services/msg91Service.ts:71-89` — `verifyOtp` only calls the MSG91 widget locally; the result
  never leaves the device.
- `src/screens/AuthScreen.tsx:252-256` — when MSG91 returns `invisibleVerified`, the app skips the
  OTP screen entirely.

**Concrete impact**
The MSG91 OTP is cosmetic. The Supabase anon key is embedded in the release APK
(`src/lib/supabase.ts:16-34`, `.env.example:10-12`) and public signup is reachable with it. An
attacker can POST directly to `POST /auth/v1/signup` with
`email="<any 10-digit number>@msg91.local"` and a chosen password and create an account for a phone
number they do not control, never receiving an OTP. This also enables:
- **Phone-number squatting / denial of registration:** the real owner's later signup maps to the
  same synthetic alias and is rejected as "already registered" (`AuthService.ts:265-266, 344-345`).
- **Impersonation of an unregistered number:** the profile/shop is created with the attacker's data
  under the victim's phone alias.

**Preconditions:** ability to extract the anon key from the APK (standard for any client) and reach
the Supabase REST endpoint. No victim interaction required.

**Recommended fix**
Move phone ownership proof server-side: send the OTP and verify it on the app backend, and only
then create the account (e.g. backend uses the service role to create the user, or issues a signed
one-time token that the signup RPC validates). Alternatively disable public signup in Supabase and
route all registration through an endpoint that verifies the MSG91 `reqId` + OTP server-side. Do not
treat `signupStep`/`verified` client state as a security boundary.

---

## F2 — Account role is derived from client-controlled `user_metadata`; a missing profile is recreated as `owner`  [High]

**Evidence**
- `src/auth/ProfileService.ts:87,106` — `userMetaRole` is read from `user.user_metadata?.role`
  (Supabase `raw_user_meta_data`).
- `src/auth/ProfileService.ts:139` — `const isLabourAccount = userMetaRole === 'labour';`
- `src/auth/ProfileService.ts:198-207` — when no profile row exists, the client upserts one with
  `role: isLabourAccount ? 'labour' : 'owner'` — i.e. **anything other than the exact string
  `'labour'` yields `owner`** (including an empty or attacker-modified value).
- `src/auth/ProfileService.ts:179` — existing rows also default `role: existing.role || 'owner'`.
- Enabling DB behaviour (task_0002 scope): the `profiles` INSERT policy allows a user to insert
  **their own** row with an unconstrained `role`
  (`supabase/schema.sql:109-118`, branch `id = auth.uid()`), and `guard_profile_privileges` only
  fires `BEFORE UPDATE` (`supabase/migrations/20260929_security_hardening.sql:60-68`), not INSERT.
  The signup trigger likewise trusts `raw_user_meta_data->>'role'`
  (`supabase/schema.sql:214-217`).

**Concrete impact**
`user_metadata` is writable by the account holder via `supabase.auth.updateUser({ data: {...} })`.
If a labour/staff auth user's `profiles` row is absent — a state the code explicitly treats as
normal and self-heals (`ProfileService.ts:195-197`, `AuthProvider.tsx:56-60`; e.g. the owner
removed the staff profile via `profiles_delete_owner`, or a "skipped row" from an older build) — the
staff member can set `user_metadata.role` to `'owner'` (or anything non-`labour`) and, on next
sign-in, `ensureOwnerProfile` creates a `profiles` row with `role='owner'`, converting revoked staff
into a shop owner. The server INSERT policy does not block this because it does not constrain
`role` for self-inserts.

**Preconditions:** attacker holds valid credentials for a labour account whose profile row is
missing, plus the ability to call `updateUser` (available to any authenticated client).

**Recommended fix**
Never derive authorization from `user_metadata` (client-writable). Set `role`/`shop_id` server-side
only (trigger reads a server-only source, or the profile is created exclusively by the DB trigger
with a role that the client cannot influence). Add a `BEFORE INSERT` privilege guard and constrain
the self-insert RLS policy to `role = 'owner'` (or forbid client inserts entirely).

---


## F3 — `isOwner` fails open when the profile is missing  [Medium]

**Evidence**
- `src/auth/AuthProvider.tsx:190`
  ```ts
  const isOwner = state.profile?.role ? state.profile.role === 'owner' : true;
  ```
  When `profile` is `null` (load failed, still loading, or no row) `isOwner === true`.

**Consumers (owner-only UI/actions gated on this value)**
- `src/auth/AuthProvider.tsx:209` → `resetLabourPassword(isOwner, …)` (`LabourService.ts:68` guard).
- `src/screens/InventoryScreen.tsx:236,276,298` (add/edit/delete inventory UI).
- `src/screens/FinanceScreen.tsx:432` (finance screen access).
- `src/screens/RepairDetailScreen.tsx:66` (`canEdit`).
- `src/screens/SettingsScreen.tsx:177,225`, `HomeDashboardScreen.tsx:671`,
  `ProfileEditCard`/`BrandingAndProfileCard` (shop name/logo editing).

**Concrete impact**
A staff (labour) account, or any account whose profile fails to load, is rendered the owner UI and
can invoke owner-only client actions. The most sensitive paths are server-enforced
(`admin_reset_labour_password` re-checks the caller's role in SQL — `supabase/schema.sql:641-690`;
shop rename is scoped by `owner_id`), so this is a **fail-open client authorization default** rather
than a direct server bypass. It is still a real defect: it defeats client-side least privilege and
exposes owner-only screens (finance, staff management, inventory editing) whenever the profile is
unavailable. Note `BottomNavBar.tsx:20,38` uses `isLabour`, which is `false` for a null profile, so
a labour user with an unloaded profile is shown the owner navigation.

**Preconditions:** transient or persistent profile-load failure for a non-owner account, or a
non-owner account with no profile row.

**Recommended fix**
Default to least privilege: `const isOwner = state.profile?.role === 'owner';` and treat
`profile === null` as "not yet authorized" (keep `loading`/`configured` gates) rather than owner.

---

## F4 — Deep-link handler accepts auth credentials from any URL (session injection / account confusion)  [Medium]

**Evidence**
- `App.tsx:52-62` — every URL delivered by `Linking.addEventListener('url')` / `Linking.getInitialURL()`
  is passed to `handleAuthDeepLink(supabase, url)` with no scheme/host/path check.
- `src/auth/deepLink.ts:43-78` — the handler does not validate the URL origin. It accepts:
  - a PKCE `code` from the query string (line 56-63), and
  - an implicit-flow `access_token` + `refresh_token` pair from **either** the fragment **or** the
    query string (lines 29-30, 66-76),
  then calls `client.auth.setSession(...)`.
- The app scheme is a custom scheme `myapp` (`app.config.js:11`), which any app or browser on the
  device can invoke.

**Concrete impact**
Session fixation / account confusion. An attacker who can get the victim to open a crafted link
(e.g. `myapp://anything?access_token=<attacker AT>&refresh_token=<attacker RT>` — attacker's own
valid tokens for the same Supabase project) causes the victim's app to adopt the attacker's session.
The victim then enters repairs, customer PII and shop data into the attacker's account, which the
attacker can read. Because the handler accepts the query string as well as the fragment, it also
matches URLs that are not the configured auth redirect (`myapp://auth`).

**Preconditions:** victim opens an attacker-supplied deep link; attacker possesses valid tokens for
the same project. `setSession` validates the tokens against the project, so tokens from another
project do not work.

**Recommended fix**
Validate the URL before use: require the expected scheme/host/path (e.g. `myapp://auth`) and reject
everything else. Prefer PKCE-only (drop the implicit `access_token`/`refresh_token` branch), and
treat an implicit-flow token arrival as untrusted/opt-in. Optionally surface a confirmation before
replacing an existing session.

---

## F5 — Supabase session tokens stored unencrypted in AsyncStorage  [Medium]

**Evidence**
- `src/lib/supabaseAuthStorage.ts:10-23` — `nativeStorage()` persists the Supabase auth session
  (access + refresh tokens) with plain `AsyncStorage`; the comment states it is "secure enough".
- `src/lib/supabase.ts:34-40` — this adapter is wired into `createClient({ auth: { storage, persistSession: true } })`.
- `src/utils/shopSettings.ts:184-199` — shop branding (name/phone/logo) is also cached in AsyncStorage.

**Concrete impact**
AsyncStorage is not encrypted (Android: app-private SQLite/`RKStorage`; iOS: app sandbox plist).
The long-lived refresh token is recoverable on a rooted/jailbroken device, via `adb backup` when
Android backup is enabled, or by any code able to read the app sandbox — enabling full account
takeover until the refresh token is revoked. No secure keystore (expo-secure-store /
react-native-keychain) is used.

**Preconditions:** device compromise, root, or an enabled device backup; or another process with
access to app-private storage.

**Recommended fix**
Store the auth session in the platform keystore (Keychain / Android Keystore) via
`expo-secure-store` or `react-native-keychain`, and set `android.allowBackup=false` (or exclude the
storage DB). Do not describe AsyncStorage as secure for tokens.

---


## F6 — User/account enumeration through distinct error messages  [Low]

**Evidence**
- `src/auth/AuthService.ts:66-74, 136, 194` — a candidate that exists but is unconfirmed throws
  `EMAIL_NOT_CONFIRMED` (`constants.ts:24-25`), while a non-existent identifier falls through to
  `INVALID_CREDENTIALS` (`AuthService.ts:147-152`).
- `src/auth/AuthService.ts:265-266, 344-345` — signup reports "already registered" for existing
  accounts.

**Concrete impact**
An attacker can distinguish "account exists" from "wrong credentials / no account" for arbitrary
phone numbers or emails, enabling targeted phishing and the squatting described in F1.

**Recommended fix**
Return a single generic message/error for all failed credential attempts and for the signup
"already exists" case (or move existence checks server-side without revealing them).

---

## F7 — MSG91 OTP state is a shared module global and is not bound to the phone  [Low]

**Evidence**
- `src/services/msg91Service.ts:7` — `let requestId = '';` is module-global.
- `src/services/msg91Service.ts:55, 82` — `sendOtp` overwrites `requestId`; `verifyOtp` verifies
  whatever the last `requestId` was, with no phone parameter.
- `src/screens/AuthScreen.tsx:285` — `verifyOtp(otp)` is called with the OTP only.

**Concrete impact**
There is no binding between the phone number an OTP was sent to and the account that is later
created. In the current UI the phone field is locked after the OTP request
(`AuthScreen.tsx:489, 498`, `editable={false}`), which limits practical exploitation, but the code
itself would allow an OTP verified for number A to be reused to proceed with registration of number
B if the flow is changed or the state is manipulated. Concurrent requests would also clobber each
other's `requestId`.

**Recommended fix**
Return and carry an explicit `reqId`/verification handle tied to the specific phone (pass the phone
into `verifyOtp`), keep it in component state rather than a module global, and confirm the verified
phone equals the phone being registered at signup time.

---

## F8 — Weak password policy and owner-set labour passwords with no forced change  [Low]

**Evidence**
- `src/screens/AuthScreen.tsx:311` — minimum password length is 6.
- `src/auth/LabourService.ts:6-61` — the owner supplies the labour account password at creation;
  `LabourService.ts:63-78` resets it via `admin_reset_labour_password`.
- `supabase/schema.sql:682-684` — server also enforces only `length >= 6`.

**Concrete impact**
Weak/guessable passwords are accepted, and staff members use credentials chosen by the owner with
no forced rotation, increasing credential-stuffing and insider-abuse risk.

**Recommended fix**
Raise the minimum length and add basic strength checks client- and server-side; require the labour
user to change the owner-assigned password on first login.

---

## F9 — Global `signOut()` on every sign-in attempt; labour alias derived from a truncated shop UUID  [Low]

**Evidence**
- `src/auth/AuthService.ts:128` — `signInUser` calls `await supabase.auth.signOut()` before trying
  any candidate, so a failed/abandoned sign-in always destroys the current session. The comment at
  `AuthService.ts:127` acknowledges "token confusion" as the motive.
- `src/auth/LabourService.ts:22-24` — the staff alias is
  `${username}.${shopId.substring(0,8)}@mcaphonewala.internal`. The shop code is the first 8 hex
  chars of the shop UUID, so two shops with the same prefix collide, and `username` is not validated
  for `@`/`.` characters before being interpolated into an email address (`LabourService.ts:16-24`).

**Concrete impact**
- The unconditional `signOut()` is a minor availability/logic issue (a malformed identifier forces
  the current user out) rather than a direct bypass; the same credentials are re-checked afterwards.
- Alias derivation can produce collisions or malformed addresses (e.g. a username containing `@`),
  which may create confusing/locked accounts or, in the collision case, attach staff to the wrong
  shop namespace.

**Recommended fix**
Only sign out the existing session after a candidate actually fails, or use a scoped attempt that
does not tear down a valid session. Derive the staff alias from the full, unique shop id and
validate/reject usernames containing `@` or `.` (and enforce the allowed charset) before building
the email.

---

## Notes / non-findings (verified, no action required)

- `handleExistingUserSignUp` (`AuthService.ts:182-228`) converts a signup collision into a password
  login, but requires the correct password, so it is not an authentication bypass by itself.
- `resetLabourPassword` (`LabourService.ts:63-78`) and `createLabourAccount`
  (`LabourService.ts:6-14`) are additionally guarded server-side
  (`supabase/schema.sql:641-690` checks the caller's role/shop; the INSERT policy restricts owners to
  their own shop), so the client-side `isOwner`/`role` checks are defense-in-depth, not the sole
  control.
- Deep-link PKCE `exchangeCodeForSession` requires the locally stored `code_verifier`, so a forged
  `code` alone cannot establish a session; the implicit-token branch (F4) is the exploitable path.

