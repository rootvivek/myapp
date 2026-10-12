# Agent Handoff: MCA Phone Wala

> **Audited:** 2026-11-10 (repository source and local checks); signup authorization remediation started 2026-12-10
> **Repository:** `myapp`
> **Current checked-in release at audit:** `v1.2.0` (`8d7e2b5`); working-tree files identify app/package version `1.2.1`, Android version code `13`.
> **Environment:** React Native `0.79.2`, React `19.0.0`, TypeScript `~5.9.2`, Node `>=18 <21` (backend package requires `>=18`), macOS.

## 1. Project at a glance

MCA Phone Wala is a React Native mobile app for phone repair shops. The repository currently contains:

- Repair job creation, editing, search, detail/history, IMEI/QR scanning, image attachments, payment tracking and statuses `pending`, `in_progress`, `completed`, `delivered`.
- Inventory management with stock deduction when an item is consumed by a repair.
- Finance views, customer directory, shop/profile settings, and owner-managed labour accounts.
- Khata Book ledgers (parties and transactions), shared-ledger invitations, verified-phone matching, explicit consent, and sanitized shared reads.
- Branded PDF invoice creation using `pdf-lib`, saved/shared through React Native FS and Share; WhatsApp status messages are composed as drafts (no push notification service is present).
- Companion Express backend for MSG91 OTP, verified-phone claims, labour sign-in/provisioning, and app update checks.

The logged-out app opens on its dashboard. Repair jobs and Khata require sign-in; authentication is reachable from the User tab/dashboard actions. Roles in code are `owner`, `labour`, and `admin`.

## 2. Stack and commands

| Area | Verified implementation |
| --- | --- |
| Mobile | React Native `0.79.2`, React `19.0.0`, TypeScript `~5.9.2`; bare RN project with Expo app metadata/config |
| Navigation/UI | React Navigation 7 native stack, React Native Paper, custom theme/components, Lucide icons, SVG |
| Data/auth | Supabase JS `2.108.0`, persisted auth, client anon key, Postgres RLS; URL polyfill loaded before Supabase |
| OTP/backend | Express 4, MSG91, Supabase server-side service-role client; Render blueprint in `render.yaml` |
| PDF/share | `pdf-lib`, `react-native-fs`, `react-native-share` |
| Tests | Jest 30, `ts-jest`; current tests are utility/unit tests under `src/__tests__` |

Useful scripts from `/Users/vivek/Downloads/myapp/package.json`:

```sh
npm test -- --runInBand
./node_modules/.bin/tsc --noEmit
npm start -- --reset-cache
npm run build:apk
npm run deploy:backend
npm run version:bump -- patch --dry-run
```

**Checks run during this audit:** `npm test -- --runInBand` passed: 4 suites, 21 tests; `./node_modules/.bin/tsc --noEmit` passed with no diagnostics. These checks only describe this local working tree, which has substantial pre-existing changes; they do not establish Supabase migration/RLS correctness or a native Android build.

## 3. Repository map

```text
App.tsx                         Root providers and auth deep-link handling
src/auth/                       Auth provider, auth/profile/shop/labour services
src/components/                 Shared UI, repair cards, bottom navigation
src/context/                    Auth/theme/tab/repair/inventory contexts
src/db/                         Supabase repositories and database helpers
src/features/khata/             Khata navigation, screens, service, ledger math
src/navigation/                 Root stack and route types
src/screens/                    Dashboard, repairs, finance, inventory, settings
src/services/                   Repair/inventory services, OTP, updates
src/utils/                      PDF invoices, receipts, branding, formatting
supabase/schema.sql             Baseline/core schema, RLS, shop-logo storage
supabase/migrations/            Inventory security/RPC and incremental Khata changes
backend/otp-server.js            OTP, phone claim, labour login, update API
AGENT_HANDOFF.md                This audit and follow-up checklist
DEPLOYMENT.md                   Render/backend and Android release guide
```

The root `README.md`, `AGENTS.md`, and `docs/` directory are absent at this audit. Android files exist locally but are ignored/not tracked (`/android` in `.gitignore`); do not assume another checkout has the local Gradle setup or artifacts.

## 4. Current workflows and important details

### Authentication and tenant scope

- The app uses Supabase email/password auth with synthetic email aliases for phone-based owner login (`<digits>@msg91.local`) and labour identifiers (`@mcaphonewala.internal`). Do not change the owner alias domain without a compatible account migration.
- Signup OTP is sent and verified by backend routes; the client submits a one-use verification ticket to `/api/claim-verified-phone` after it has a Supabase session. The backend validates the bearer token before saving `verified_phone_identities` with its service role.
- App-side Supabase uses only the public anon key. The service-role key belongs only on the backend. The app currently reads Supabase URL/key from `@env` with a `react-native-config` fallback.
- Repositories generally require the authenticated user context and additionally filter by `shop_id` or owner `user_id`; database RLS remains the security boundary. Review both query filters and policies when changing tenant behavior.
- `AuthProvider` defaults `isOwner` to true when a loaded profile has no role; be careful changing fallback or profile recovery behavior.

### Repair, inventory, invoices

- Service/repository split is in `src/services/repairService.ts` + `src/db/repairRepository.ts`, and corresponding inventory files.
- Repair statuses are the four lower-case values above; older handoff text listing `Waiting for Parts` or `Cancelled` is outdated.
- Inventory deduction calls `deduct_inventory_stock` RPC for an atomic, scoped decrement; it has a scoped read-modify-write compatibility fallback only when that function is missing. Apply `supabase/migrations/20260929_inventory_stock_rpc.sql` to enable atomic behavior.
- Invoice generation is `src/utils/invoicePdfDesign.ts` and uses `pdf-lib`; `src/utils/receipt.ts` handles local/remote logo conversion and sharing. `react-native-html-to-pdf` is not the current PDF generator.
- Status WhatsApp text is built in `src/utils/repairStatusNotification.ts`; it is a composed message, not a server notification.

### Khata and Supabase

- Khata code lives under `src/features/khata/`; routes are nested in `KhataNavigator` and mounted from the root stack. Ledger amounts are integer paise; balances are derived from transactions, not stored mutable totals. See `src/features/khata/utils/ledger.ts`.
- Incremental Khata migrations, in order, are `20261010_khata_tables.sql`, `20261011_khata_sharing.sql`, `20261012_khata_phone_matching.sql`, `20261013_khata_party_summaries.sql`; `20261014_shop_logo_storage.sql` adds shop logo support. The baseline `supabase/schema.sql` contains the core schema and shop logo storage but does **not** define the Khata tables/sharing/matching/summaries.
- Apply migrations to the target Supabase project before using these features. The app currently surfaces a Khata setup message when the tables/functions are missing.
- Sharing requires explicit acceptance. Phone matching is exact and creates only pending requests for a unique party match; match alone grants no ledger access. Shared reads intentionally omit private party and transaction notes. More detailed security/deployment notes and a non-production verification checklist are in `/Users/vivek/Downloads/myapp/supabase/KHATA_SHARING.md`.
- Shop-logo migration makes the `shop-logos` bucket public for reads and restricts writes to a user-owned folder. Treat uploaded logo contents/URLs as public.
- `supabase/schema.sql` and the incremental migrations are not demonstrated as applied to any deployed database by this audit. SQL/RLS behavior needs validation in a disposable Supabase project before release.

### Backend and release

- `backend/otp-server.js` routes include `/api/send-otp`, `/api/verify-otp`, `/api/claim-verified-phone`, `/api/labour/sign-in`, authenticated `/api/labour/create`, `/api/signup-with-otp`, `/app/update/check`, and `/health`.
- Backend required secrets/config include `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `MSG91_AUTHKEY`; the app's `UPDATE_API_URL` must point at the backend. See root and backend `.env.example`, `render.yaml`, and `DEPLOYMENT.md`.
- OTPs, verification tickets, rate-limit counters, and lockouts are in process memory (`Map`); restarting drops them and horizontally scaled instances do not share them. Use a shared atomic store before scaling the service.
- Keep release version/name/code and Android download URL aligned across app config and backend/Render. Version code must increase. `scripts/bump-version.js` updates tracked package/app config and local Android Gradle/env values if present; inspect its diff before committing because Android and `.env` may be local-only.
- Release build output when available: `android/app/build/outputs/apk/release/app-release.apk`. No native build was run in this audit.

## 5. Documentation corrections made in this audit

This handoff replaces stale statements that referenced missing `ComingSoon` UI, unfinished home tiles, `react-native-html-to-pdf`, older repair statuses, stale version data, and an inaccurate initial project layout. `DEPLOYMENT.md` was also updated to remove a stale sample version response and use the current `scripts/bump-version.js` release flow. `CHANGELOG.md` still needs a release-specific update after confirming which version is actually being published.

### Security audit findings and remediation status (2026-12-10)

The repository-only, read-only audit identified these prioritized risks; production configuration and live Supabase state were not inspected:

1. **Signup authorization / tenant boundary (critical):** the Auth signup trigger originally trusted `raw_user_meta_data.role` and `shop_id`, values public users can choose, so a forged signup could receive staff membership in another shop. Remediation started in migration `20261017_signup_authorization_boundary.sql`: derive roles from trusted `raw_app_meta_data`, restrict self-profile inserts, and provision staff through an owner-authenticated backend route. Existing staff `app_metadata` is backfilled from their profiles in that migration. A disposable Supabase/RLS run is still required.
2. **Staff account revocation (high):** removing a staff member deletes only their profile and leaves the Auth account able to sign in. The worktree remediation does not yet address this; see next steps.
3. **OTP controls (high):** OTPs, tickets and rate limits use process-local `Map`s, so restarts discard state and horizontally scaled instances do not share atomic one-use checks.
4. **Repair/inventory consistency (high):** retryable repair saves can repeat stock deductions, and repair/inventory writes can partially succeed. Move stock effects to an atomic/idempotent database transaction.

The remediation in progress moves labour creation off public client-side `signUp` onto `/api/labour/create`, verifies the bearer token and owner/shop ownership server-side, and sets `app_metadata` via Auth Admin. Public `raw_user_meta_data` no longer determines role/shop in `handle_new_user`. Coverage includes backend unit tests; SQL/RLS and end-to-end signup remain unverified until the disposable project test.

## 6. Working tree and git context (important)

At remediation start, branch `main` was at `8d7e2b5` (`v1.2.0`, tracking `origin/main`). The working tree already contained numerous user changes before these changes: modified app/repository/UI files, deleted UI/util files, and two untracked seller migrations. Those changes are unrelated and were preserved. This task adds signup-authorization backend/SQL changes and tests, plus updates this handoff; do not reset, stash, or overwrite other work.

## 7. Next steps / outstanding verification

1. **Validate the signup boundary before release:** apply `/Users/vivek/Downloads/myapp/supabase/migrations/20261017_signup_authorization_boundary.sql` to a disposable Supabase project and test normal owner signup, forged `user_metadata.role/shop_id`, trusted Admin-provisioned labour, labour profile recovery, RLS insert/update attempts, and unrelated-shop access. The migration now recreates `shops_owner_id_fkey` as `NOT VALID` so pre-existing orphaned `owner_id` rows do not block deployment; PostgreSQL still enforces the FK for new writes. Audit/fix legacy orphan shops, then run `ALTER TABLE public.shops VALIDATE CONSTRAINT shops_owner_id_fkey;`. This environment has no `psql`, Supabase CLI, Docker, or disposable project configured, so migration/RLS execution remains pending.
2. **Revoke existing staff sessions on removal:** `deleteLabourUser` currently deletes only `public.profiles`; add a trusted Auth Admin delete/ban path and test existing access-token behavior before treating staff removal as complete.
3. **OTP backend hardening before scale:** replace in-memory OTP/ticket/rate-limit state with a shared store that supports atomic one-use consumption; confirm production secrets and HTTPS URL; exercise invalid/replayed tickets and invalid bearer tokens.
4. **Repair/inventory consistency:** make repair save plus stock consumption atomic/idempotent; verify retries and partial failures do not double-deduct inventory.
5. **Release alignment:** current tracked baseline is `v1.2.0`, but the working tree package/app/env examples say `1.2.1` / Android code `13`. Determine whether `1.2.1` is intended, compare with local Android `build.gradle` and deployed Render variables, and update all release metadata together. Verify the GitHub APK URL and the revised instructions in `/Users/vivek/Downloads/myapp/DEPLOYMENT.md`.
6. **Native QA:** run Android release build and device/emulator smoke tests for login/signup, labour creation/removal, repair creation/status/payment, inventory deduction, invoice PDF/share, Khata migration failure/success, invite acceptance/revocation, and update install. Local Android files are ignored and no build was performed here.
7. **Keep tests current:** Jest covers 4 utility-focused suites (21 tests); new backend unit tests cover trusted labour provisioning. Live Supabase policy tests and broader backend integration coverage remain outstanding.

## 8. Audit verification record

Executed on the current worktree:

| Check | Result |
| --- | --- |
| `npm test -- --runInBand` | PASS — 4 suites, 21 tests |
| `./node_modules/.bin/tsc --noEmit` | PASS — no diagnostics |
| `npm --prefix backend test` | PASS — 5 trusted labour provisioning tests |
| `node --check backend/otp-server.js backend/labour-auth.js` | PASS — syntax checks |
| `git status` / recent history | Inspected; substantial pre-existing changes, HEAD `8d7e2b5` |
| Native Android build | Not run |
| Supabase migrations/RLS against a live database | Not run; requires disposable test project |
