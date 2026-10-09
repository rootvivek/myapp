# Client data / services / UI audit (task_0004)

Scope: `src/db/**`, `src/context/**`, `src/services/**` (excluding `msg91Service`),
`src/utils/**`, `src/screens/**`, `src/components/**`, `App.tsx`, `app.config.js`,
`app.json`, `scripts/**` (excluding `deploy-backend.js` / `verify-production.js` /
`update-database.sh`).

Method: static read of every file in scope; each finding cites exact file:line and
a concrete trigger. No speculation; items already handled correctly are listed at
the end.

---

## High

### H1. Inventory stock deduction is dead code — stock is never decremented (and would double-deduct if wired)
- Evidence: `src/screens/AddRepair/hooks/useRepairSave.ts:150-154` dedupes and
  loops `state.selectedInventoryItemIds` calling `deductInventoryStock(invId, 1)`
  after **every** save (create *and* edit). `selectedInventoryItemIds` is only
  ever *defined* — `src/screens/AddRepair/types.ts:28`,
  `src/screens/AddRepair/reducer.ts:30` — and is **never assigned anywhere** in the
  codebase (no picker dispatches `SET_FIELD`/`SET_FORM_DATA` for it; the edit
  prefill `AddRepairScreen.tsx:210-232` does not set it either).
- Impact:
  1. Attaching a spare part to a repair never reduces `inventory.stock_count`, so
     the advertised "Live stock count with auto deduction"
     (`src/screens/HomeDashboardScreen.tsx:130`) is false and stock drifts from
     reality.
  2. The loop sits *outside* the `isEdit` branch, so the moment a picker is wired
     up, saving an edit re-deducts every attached part again, and deleting a repair
     never restores stock. Deduction failures are also swallowed
     (`inventoryRepository.ts:128-137`), so a wired flow can silently lose updates.
- Fix: add the missing inventory-picker UI, persist the selection on edit, and
  deduct only the *delta* on create/update (restore on delete/removal). Surface
  (do not swallow) deduction failures.

---

## Medium

### M1. Two contradictory "current version" sources break update logic
- Evidence: `src/components/AutoUpdater.tsx:4-5` hardcodes
  `CURRENT_VERSION_CODE = 10` / `CURRENT_VERSION_NAME = '1.0.9'` (used by the
  Settings manual check `SettingsScreen.tsx:69,89` and `AccountCard`).
  `src/services/autoUpdate.ts:121-130` instead reads `APP_VERSION_CODE` /
  `APP_VERSION_NAME` from `@env`, defaulting to `1`/`'1.0.0'`.
  `.env.example:33-34` ships `APP_VERSION_NAME=1.0.6` / `APP_VERSION_CODE=7`, while
  `app.json:5` says `1.0.9`.
- Impact: the two update paths compare the installed build against different
  numbers. A build whose `.env` was not bumped (default code `1`) is told every
  published version is an update; the hardcoded `10` can hide a real update or
  force a downgrade prompt. Settings also shows a version string that may not match
  the installed APK.
- Fix: single source of truth — read the installed native
  `versionCode`/`versionName` at runtime, or generate one constant at build time
  and use it in both paths.

### M2. APK auto-update downloads/installs with no cryptographic integrity check; cleartext allowed
- Evidence: `src/services/autoUpdate.ts:220-229` (`getRemoteSize` uses only
  `Content-Length`), `:271-302` (`downloadApk` retries until on-disk bytes equal the
  server's `Content-Length`), `:359-389` (`downloadAndPrepareApk` then installs),
  `:304-315` (`installApk`). `AutoUpdateInitializer.tsx:37` enables APK updates by
  default (`ENABLE_APK_UPDATE !== 'false'`), and `.env.example:24` ships
  `UPDATE_API_URL=http://localhost:3001`; `resolveApiBaseUrl`
  (`autoUpdate.ts:58-69`) rewrites loopback hosts to the LAN/Metro host and keeps
  the `http` scheme.
- Impact: the download URL comes from the update-server response
  (`autoUpdate.ts:192`) and is neither hashed nor signature-verified client-side;
  transport can be cleartext HTTP. Android's installer enforces the same signing
  certificate, so foreign-key code is not installable, but same-key downgrades,
  corrupted archives that coincidentally match `Content-Length`, and cleartext
  tampering remain possible. (The Supabase path is safer: it rejects non-`https`
  URLs, `SettingsScreen.tsx:79-83`.)
- Fix: require `https://` for `downloadUrl`, publish a SHA-256 in the manifest,
  verify the downloaded APK hash before install, and fail closed on mismatch.

### M3. Unpaid jobs whose advance fully covers cost vanish from both Finance lists
- Evidence: `src/screens/FinanceScreen.tsx:217-221` pushes to `dues` only when
  `!isPaid && cost > adv`, and to `paid` only when `isPaid`. A job with
  `isPaid === false` and `advance >= cost` lands in **neither** list, yet its
  advance is still added to `totalPaid` (`:205-209`).
- Impact: the owner cannot find, edit, or mark such a job from the Dues/Paid tabs,
  and the summary cards do not reconcile with visible rows (money counted that no
  row represents). Trigger: enter `advance == repairCost` without ticking "paid".
- Fix: classify strictly by `isPaid`; treat `advance >= cost && !isPaid` as a
  zero-balance/paid row (or its own bucket) so every job appears exactly once.

### M4. Invoice "barcode" is random and cannot be scanned, but the scanner tells users to scan it
- Evidence: `src/utils/receipt.ts:370-384` draws 30 rectangles with
  `Math.random()` widths; nothing encodes `repair.orderCode`.
  `src/screens/ScanQrScreen.tsx:172` prompts "Point camera at the receipt barcode
  to open the repair status", and `:103-112` matches scanned values against
  `orderCode`/`id`.
- Impact: scanning a printed invoice can never resolve a job (or can match a random
  value), so a user-facing workflow is broken/misleading.
- Fix: render a real Code128/QR encoding `orderCode` (e.g. a JS barcode library), or
  remove the barcode and the scanner hint.

### M5. `parseMoney` silently corrupts mistyped amounts (feeds invoices and finance totals)
- Evidence: `src/utils/format.ts:20-27` strips every char except `[0-9.]` then
  `parseFloat`; no validation for multiple dots and no bounds.
- Impact: `"1.2.3" -> 1.2`, `"5-10" -> 510`, `"1e3" -> 13`, `"12 34" -> 1234`.
  These become `repair_cost`/`advance_amount`, printed on invoices
  (`receipt.ts:334-338`) and summed into earnings (`FinanceScreen.tsx:198-209`), so
  a typo silently changes money owed.
- Fix: strict numeric validation (single optional decimal, reject other chars) plus
  a sane max; show an inline error instead of coercing.

### M6. Branding cache is shared across accounts and not cleared on sign-out
- Evidence: `src/utils/shopSettings.ts:5` (`BASE_SETTINGS_KEY`), `:35-40`
  (`getKey`), `:65-73` (`readCachedBranding` falls back to the base key), `:196-198`
  (`saveShopBranding` always also writes the base key). `getShopBranding()` is
  called with **no scope** from `receipt.ts:127,167`. Sign-out
  (`AuthProvider.tsx:185-187`) does not clear it.
- Impact: on a shared device the previous account's shop name/phone/logo persist
  under the shared key and are used whenever the DB lookup yields nothing
  (`fetchBrandingFromDb` returns `null` without a session or on error,
  `shopSettings.ts:87-148`), so an invoice can carry the wrong shop's details.
- Fix: clear branding keys on sign-out; when a scope key is provided, do not fall
  back to the shared base key.

### M7. Realtime subscriptions trust RLS with no filter and no ownership re-check
- Evidence: `src/context/RepairsContext.tsx:100-122` and
  `src/context/InventoryContext.tsx:92-121` subscribe to `postgres_changes` on the
  whole `repairs` / `inventory` tables with no `filter`, then apply every delivered
  `newRow` straight into state (`rowToRepair`/`rowToInventory`) without re-checking
  `shop_id`/`user_id`.
- Impact: isolation depends entirely on RLS. Given the RLS gaps recorded in
  `.audit/db.md`, any row the server-side policy fails to exclude is rendered live
  to the wrong tenant. Defense-in-depth: the client provides no second line.
- Fix: add `filter: 'shop_id=eq.<shopId>'` (and/or `user_id=eq.<uid>`) and
  defensively drop rows whose tenant key does not match the current context.

---

## Low

### L1. `escapeHtml` is a no-op
`src/utils/receipt.ts:35-41` replaces `&`,`<`,`>`,`"` with themselves, performing
zero escaping. It is currently unused (invoice rendering is pdf-lib, sanitized by
`pdfSafe` at `receipt.ts:23-33`), so there is no live XSS today - but it is a trap
for any future HTML/template receipt. Remove it or implement correct escaping.

### L2. Hardcoded values in source
`src/utils/shopSettings.ts:16` embeds a real shop phone
(`LEGACY_DEFAULT_SHOP_PHONE = '8881765192'`); `:9` and `AutoUpdater` embed a
fallback shop name; `src/services/autoUpdate.ts:179` hardcodes the package name
`com.myapp`. Low impact, but a real number/identity baked into the shipped bundle.

### L3. `readUriAsBase64` fetches any http(s) logo URL with no host/size guard
`src/utils/receipt.ts:61-77` will `fetch()` whatever `branding.logoUri` holds
(DB- or cache-derived) and buffer it into base64. If that value is ever
attacker-controlled this is a client-side SSRF/DoS vector (unbounded download).
Low; add an allowlist/host check and a size cap.

### L4. Invoice PDFs persist in app storage indefinitely
`src/utils/receipt.ts:142-144` writes each invoice to `TemporaryDirectoryPath`, and
the share-failure fallback `:159-161` copies it into `DocumentDirectoryPath`
permanently, with no cleanup. Invoices contain customer name, phone, IMEI, device
and lock type. Low (app-internal storage), but the Documents copies accumulate
forever.

### L5. Logging is inconsistent and can emit server error text
`src/utils/logger.ts:6-11` is a no-op, yet ~20 call sites use `console.warn`
directly (`useRepairSave.ts:114`, `db/helpers.ts:99`, `db/repairRepository.ts:254`,
`db/inventoryRepository.ts:130/136/163`, etc.), so release builds still log. These
currently log error objects/column names, not customer PII directly, but PostgREST
error messages can embed values. Low.

### L6. Input coercion in Inventory form
`src/screens/InventoryScreen.tsx:166-167` uses `parseInt`/`parseFloat`, so
`"1e5" -> 1` and unusual inputs are silently truncated; no upper bound on
price/stock. Low.

---

## Correctly handled (verified, not findings)
- PDF text is sanitized to WinAnsi by `pdfSafe` (`receipt.ts:23-33`) and every
  `drawText` call routes through it (`:231-232`), so there is no PDF text injection
  from customer-controlled fields.
- `repair-images` bucket is private and policies scope objects by `auth.uid()` /
  shop (`supabase/schema.sql:375-410`); `SecureImage` converts the stored
  `/object/public/...` string into a 15-minute signed URL (`SecureImage.tsx:57-77`),
  so stored "public" URLs for a private bucket are not actually publicly readable.
- The Supabase update path rejects non-`https` `apk_url` before opening it
  (`SettingsScreen.tsx:79-83`).
- Inventory create/update clamps to `>= 0` (`InventoryScreen.tsx:166-167`), repair
  search input is stripped of PostgREST metacharacters and executed through the
  server-side `search_repairs_for_user` RPC (`repairRepository.ts:181-188`), and
  phone/WhatsApp URLs strip to digits and `encodeURIComponent` the message
  (`FinanceScreen.tsx:269-276`, `phone.ts:11`).
- `FormTextInput` fields carry `maxLength` bounds (e.g. `AddSellerModal.tsx:120-154`).
