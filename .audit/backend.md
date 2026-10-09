# Backend Security Audit — `backend/` (Node/Express OTP + auto-update service)

- **Target:** `/workspace/backend/otp-server.js` (467 lines, the only HTTP server entry point), plus `backend/migrate-users-to-phone.js`, `backend/Dockerfile`, `backend/.env.example`, `render.yaml`.
- **Audited commit:** `453c276935033f91d9216e64668967881fcf099f`
- **Method:** full source read; route enumeration; logic reproduction of the OTP lockout in Node (evidence below); `X-Forwarded-For` behaviour reproduced with `proxy-addr@2.0.7` (the library Express uses).
- **Route surface (complete):** `POST /api/send-otp`, `POST /api/verify-otp`, `POST /api/signup-with-otp`, `POST /app/update/check`, `GET /health`. No other `app.listen`/`express()` in the repo.

## Findings summary

| # | Severity | Location | Issue |
|---|----------|----------|-------|
| 1 | **High** | `backend/otp-server.js:135` (fn at `129-153`) | OTP brute-force lockout is dead code — never triggers |
| 2 | **High** | `backend/otp-server.js:294-307` | `/api/signup-with-otp` checks the OTP with **no** lockout and **no** attempt tracking |
| 3 | **Medium** | `backend/otp-server.js:62-86,180-183,232-235` | Rate limiting is in-memory, per-IP only; no per-phone throttle on `/api/send-otp` (SMS toll fraud / OTP bombing) |
| 4 | **Medium** | `backend/otp-server.js:13` | `trust proxy` hard-coded to `1`; `req.ip` (and therefore every rate limit) is spoofable if the deployment topology differs from exactly one appending proxy |
| 5 | **Low** | `backend/otp-server.js:17` | `ALLOWED_ORIGINS` defaults to `*` when unset |
| 6 | **Low** | `backend/otp-server.js:114-123,331-333` | Distinct "already exists" message enables phone-number enumeration (gated by a valid OTP) |
| 7 | **Low** | `backend/otp-server.js:190-221` | OTP stored/left valid even when MSG91 send fails (endpoint returns 400) |
| 8 | **Low** | `backend/otp-server.js:266,305` | OTP compared with non-constant-time `!==` |
| 9 | **Low** | `backend/otp-server.js:40-46` | Security headers incomplete (no HSTS; deprecated `X-XSS-Protection`) |
| 10 | **Low** | `backend/otp-server.js:318-379` | Signup is not transactional — a failure after `createUser` leaves an orphaned auth user (and the OTP stays valid) |

**No Critical findings.** In particular, the following were checked and are correctly handled (not reported): OTPs are generated with `crypto.randomInt` (`:166`), the Supabase **service-role key** is only used server-side and never returned to clients, raw DB errors are not forwarded (`sendServerError`, `:108-111`), request bodies are capped at 10 kb (`:28`), `x-powered-by` is disabled (`:14`), and HTTPS is enforced in production (`:31-38`). The `demoOtp` echo is gated behind `NODE_ENV === 'development'` (`:198`), which `render.yaml` and the `Dockerfile` set to `production`.


---

## 1. HIGH — OTP brute-force lockout never triggers (logic error)

**Location:** `backend/otp-server.js:129-140` (the check), `:142-153` (the recorder), used at `:248-253` and `:267`.

```js
129 function checkOtpAttempts(phone) {
130   const entry = otpAttempts.get(phone);
131   if (!entry) return { allowed: true };
132   if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
133     return { allowed: false, retryAfter: ... };
134   }
135   if (Date.now() > entry.lockedUntil) {   // <-- BUG
136     otpAttempts.delete(phone);
137     return { allowed: true };
138   }
139   return { allowed: entry.count < MAX_OTP_ATTEMPTS };
140 }
```

`entry.lockedUntil` is `null` until the counter reaches `MAX_OTP_ATTEMPTS` (`:147-151`). In JS, `Date.now() > null` coerces `null` to `0` and is **always true**. So on every request after the first failed attempt the entry is deleted and `allowed:true` is returned before the `count < MAX_OTP_ATTEMPTS` branch (`:139`) can ever run. Because `lockedUntil` is only ever set when `count >= 5` — a state that is now unreachable — the lockout at `:150` is dead code.

**Proof (reproduced from the exact source, Node v24):**

```
attempt 1: allowed=true store= null
attempt 2: allowed=true store= null
...
attempt 8: allowed=true store= null
final store entry: {"count":1,"lockedUntil":null}
```

The counter is reset to `1` on every verification call and `allowed` is always `true`; the 15-minute lockout (`:127`) never engages.

**Impact:** The 5-attempts-per-phone lockout intended to bound OTP guessing on `/api/verify-otp` provides **no protection at all**. The only remaining control is the per-IP rate limit (5/min, `:64`), i.e. the intended cap of 5 guesses per phone is replaced by an unbounded guess stream (subject only to the IP limit — see #3/#4).

**Fix:** Treat `null` as "not locked":

```js
function checkOtpAttempts(phone) {
  const entry = otpAttempts.get(phone);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil && Date.now() < entry.lockedUntil) {
    return { allowed: false, retryAfter: Math.ceil((entry.lockedUntil - Date.now()) / 1000) };
  }
  if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
    otpAttempts.delete(phone);
    return { allowed: true };
  }
  return { allowed: entry.count < MAX_OTP_ATTEMPTS };
}
```

## 2. HIGH — `/api/signup-with-otp` verifies the OTP without any lockout/attempt tracking

**Location:** `backend/otp-server.js:294-307`.

```js
294 const entry = otpStore.get(normalizedPhone);
...
305 if (entry.otp !== String(otp || '').trim()) {
306   return res.status(400).json({ error: 'OTP is invalid.' });
307 }
```

Unlike `/api/verify-otp` (`:248-253`, `:267`), the signup handler never calls `checkOtpAttempts`/`recordOtpAttempt`. It is an independent OTP-guessing oracle.

**Impact:** Even if #1 were fixed, an attacker can brute-force the 6-digit OTP through `/api/signup-with-otp` entirely bypassing the per-phone lockout. Combined with #1, both OTP endpoints are effectively unbounded. The only throttle is the per-IP rate limit (5/min, `:64`/`:281`) — 10^6 possibilities means a distributed or IP-rotating attack is the practical limit, not the intended 5-per-phone.

**Fix:** Apply the same `checkOtpAttempts`/`recordOtpAttempt` guard (and per-phone throttling) to `/api/signup-with-otp`, ideally via a shared helper so OTP verification lives in one place. Delete the OTP entry only after all account-creation steps succeed, and record a failure on every mismatch.

## 3. MEDIUM — In-memory, per-IP-only rate limiting; no per-phone throttle on OTP send

**Location:** `backend/otp-server.js:62-86` (`rateLimitStore`), `:180-183`, `:232-235`, `:281-284`.

- The limiter is a plain `Map` in process memory. It is per-instance and reset by any restart/redeploy (the Render free plan spins down on inactivity — `render.yaml`), and is not shared if the service ever scales to >1 instance. It is not a durable control.
- All limits are keyed solely on `req.ip` (`send-otp:<ip>`, `verify-otp:<ip>`, `signup:<ip>`). There is **no per-phone limit**, so `/api/send-otp` lets any client trigger up to 5 real SMS per minute per IP to arbitrary numbers → OTP-bombing / SMS toll fraud, cheap to scale by rotating source IPs.

**Fix:** Add a per-phone (and per-phone+IP) throttle for `send-otp`, cap OTP requests per number per hour, and back the limiter with a shared store (Redis/Postgres) if more than one instance can run. Consider `express-rate-limit` with a store instead of the bespoke `Map`.

## 4. MEDIUM — `trust proxy` hard-coded to `1`; rate-limit key (`req.ip`) becomes spoofable off the assumed topology

**Location:** `backend/otp-server.js:13`, consumed at `:180`, `:232`, `:281`.

`app.set('trust proxy', 1)` makes Express derive `req.ip` from `X-Forwarded-For` assuming exactly one trusted hop. Reproduced with `proxy-addr@2.0.7` (Express's implementation, `trust = (addr, i) => i < 1`):

```
XFF=[spoof 1.1.1.1, real 9.9.9.9], socket=proxy 10.0.0.1, trust=1 -> req.ip = 9.9.9.9   (safe: proxy appended real IP)
XFF=[spoof 1.1.1.1],                socket=proxy 10.0.0.1, trust=1 -> req.ip = 1.1.1.1   (spoofed)
```

The IP-based limits are safe **only if** the fronting proxy appends the real client IP and there is exactly one such hop. Add a second proxy (e.g. Cloudflare in front of Render), or run the `Dockerfile`/a VPS directly where the proxy does not append, and `req.ip` is fully attacker-controlled — every rate limit in #1/#3 becomes bypassable with a one-line header.

**Fix:** Pin `trust proxy` to the documented hop count of the production topology and/or validate the chain explicitly. Document the required proxy behaviour next to `:13`.

## 5. LOW — CORS defaults to `*` when `ALLOWED_ORIGINS` is unset

**Location:** `backend/otp-server.js:17`. `(process.env.ALLOWED_ORIGINS || '*')` means a deployment that forgets the env var allows all origins. `render.yaml` sets it, but the safe default is "deny". This API is unauthenticated and carries no cookies/tokens, so impact is limited to cross-origin abuse of the unauthenticated endpoints. **Fix:** default to an empty allow-list when unset and log a warning.

## 6. LOW — Phone-number enumeration via signup error

**Location:** `backend/otp-server.js:114-123` (`actionableSignupError`), surfaced at `:331-333`. A distinct `"An account with this mobile number already exists."` response differentiates registered vs unregistered numbers. It is gated behind a valid OTP for that number (the OTP check at `:305` precedes `createUser` at `:318`), so it is not directly enumerable — but combined with #1/#2 a determined attacker can brute-force the OTP and then enumerate. Return a generic message instead.

## 7. LOW — OTP remains valid after a failed MSG91 send

**Location:** `backend/otp-server.js:190-221`. The OTP is written to `otpStore` at `:191` **before** the MSG91 request. If the provider call fails, the handler returns HTTP 400 (`:221`) but leaves the OTP in the store, valid for 5 minutes. **Fix:** delete the `otpStore` entry (or store only after a successful send) when the provider returns non-2xx.

## 8. LOW — Non-constant-time OTP comparison

**Location:** `backend/otp-server.js:266` and `:305` (`entry.otp !== otp`). Not constant-time. With a 6-digit secret and the (intended) 5-attempt lockout the practical risk is negligible; noted for completeness. Use `crypto.timingSafeEqual` on equal-length buffers if hardening.

## 9. LOW — Incomplete security headers

**Location:** `backend/otp-server.js:40-46`. `X-XSS-Protection` is deprecated/ignored by modern browsers; there is no `Strict-Transport-Security` despite HTTPS enforcement (`:31-38`). Consider `helmet` and HSTS.

## 10. LOW — Signup is not transactional (orphaned auth user)

**Location:** `backend/otp-server.js:318-379`. If `createUser` (`:318`) succeeds but the shop insert (`:351`) or profile upsert (`:366`) fails, the handler returns 500 while the `auth.users` row persists (with `email_confirm:true`), and the OTP is **not** deleted (deletion is only at `:381`). A retry then fails with "already exists", stranding a user with no profile/shop. Correctness/robustness issue rather than a direct exploit. **Fix:** compensate (delete the created user) on downstream failure, or move provisioning into a single Supabase RPC / DB transaction.

---

### Appendix — evidence commands

- Lockout reproduction: `/tmp/lockout_test.js` (exact copy of `checkOtpAttempts`/`recordOtpAttempt`) → `allowed=true` on all 8 attempts, store count stays `1`.
- XFF reproduction: `/tmp/xff_test2.js` using `proxy-addr@2.0.7` with `trust=(a,i)=>i<1`.

