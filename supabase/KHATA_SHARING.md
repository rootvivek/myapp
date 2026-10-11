# Khata sharing deployment and security notes

Apply `migrations/20261011_khata_sharing.sql` after `20261010_khata_tables.sql`, then apply `migrations/20261012_khata_phone_matching.sql` in a non-production Supabase project before using sharing UI or automatic matching.

## Current safe flow

1. A shop owner opens a party ledger and creates an invitation.
2. The app displays a random, single-use 256-bit invitation code. The server stores only its SHA-256 hash; the owner sends the code directly to the intended person.
3. The recipient signs into their own account, opens **Shared Khata / Invitations**, and explicitly accepts or declines.
4. Only accepted active links can call the sanitized read RPC. It returns the shop name, party display name, original transaction identifiers, dates, amounts and authoritative balance deltas. It deliberately excludes phone numbers, private party notes and transaction notes.
5. Shop owners can revoke an active link. Shared transaction records are read from the original ledger, not copied.

The invitation code is a bearer credential. Share it only with the intended client. The UI does not put it in a public deep link or notification. There is no push notification service in the current project.

## Phone matching with server-verified MSG91

OTP send and verification now run through the Express backend; MSG91 credentials and OTP verification state are server-side. Successful verification produces a short-lived, one-use ticket. The app can attach it only to a valid Supabase authenticated session, and the backend checks that session before storing the unique E.164 identity. `profiles.phone`, client-supplied numbers, and unverified account metadata are never treated as proof.

After a verified identity is stored, the database finds exact phone matches among non-archived Khata parties. It creates a 30-day **pending** request only when exactly one party matches; no match or multiple matches produce no request. Matching does not grant ledger access. The user must explicitly accept; only then does the existing sanitized ledger read become available. Duplicate identity claims across accounts are rejected. A changed verified number replaces the user's old verified claim; old accepted shares remain until revoked, while a pending request for that old number is not automatically deleted.

This app currently normalizes Indian phone numbers (`+91` plus ten digits). For production, deploy the backend with `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `MSG91_AUTHKEY`, then configure `UPDATE_API_URL` in the app to that HTTPS backend origin. In-memory OTPs/tickets are one-use and short-lived, but deployments with multiple backend instances need a shared, atomic OTP/ticket store before scaling horizontally. Existing accounts should verify their number from Shared Khata; legacy stored numbers are not automatically trusted.

## Verification plan for a non-production Supabase project

- Create owner A and owner B with independent shops; add same-number parties; each invitation must redeem to its own link and ledger.
- Accept from client A, then verify client B cannot see client A's active ledger through `khata_list_shared_ledgers`.
- Attempt direct SELECT/INSERT/UPDATE/DELETE on `khata_party_links` as `authenticated`; table privileges are revoked. The security-definer APIs only permit owner issuance, token redemption, and participant revocation.
- Call `khata_create_share_invite` with an unrelated party UUID; it must fail. Redeem random, malformed, expired, and already consumed tokens; all must fail without revealing party/shop information.
- Verify rejection, shop-owner revocation, and client revocation remove the ledger from the read RPC; replaying invitation creation/redeeming cannot duplicate a `(party_id, client_user_id)` relationship.
- Add zero, one, and two non-archived party records for a test phone: verification must create zero, one pending, and zero requests respectively. Verify an exact client match cannot read anything until acceptance; after acceptance it sees only sanitized fields. Decline, expiry, duplicate number identity, same-user party, and revocation must never grant access.
- Test MSG91 send/verify, ticket expiry/replay, authenticated claim, a ticket/phone mismatch, missing or invalid Supabase bearer token, and a duplicate verified number against the deployed test backend.
- Confirm a client cannot query `khata_parties` or `khata_transactions` by UUID: existing Khata RLS remains owner/shop-scoped and no client-side grants were added. The shared RPC excludes private notes and does not duplicate transaction rows.
- Check source transaction update/correction/deletion behavior on shared reads and verify unrelated Repair Management operations.

No production database credentials or real customer data should be used for these tests. The repository does not contain a local Supabase instance/test database configuration, so database RLS behavior still needs to be exercised in a disposable Supabase project before production deployment.