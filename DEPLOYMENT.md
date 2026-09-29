# Production Deployment Guide

How the pieces fit together in production:

| Piece | Runs where | Responsibility |
| :--- | :--- | :--- |
| **Supabase** | Supabase cloud | Auth, Postgres, Realtime, storage. The app talks to it directly with the anon key + RLS. |
| **Backend** (`backend/otp-server.js`) | Render (HTTPS) | Phone OTP (MSG91) + `POST /app/update/check` for in-app APK updates. |
| **Client app** | User devices | Release APK that talks to Supabase and the Render backend. |

The app **never** points at `localhost` in production. Loopback only works in dev
(and is auto-rewritten to a reachable host there).

---

## Part A — Deploy the backend to Render

### Option 1 — Automated (recommended)

1. Put your secrets in `backend/.env` (git-ignored):
   ```env
   RENDER_API_KEY=<Render Dashboard → Account Settings → API Keys>
   SUPABASE_URL=https://<project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
   MSG91_AUTHKEY=<msg91-auth-key>
   ```
2. Make sure the repo is pushed to GitHub (Render deploys from it).
3. Run:
   ```bash
   npm run deploy:backend
   ```
   The script creates `myapp-otp-server` (or updates it if it exists), sets the env
   vars, triggers a deploy, waits until it's live, and prints the HTTPS URL.

### Option 2 — Manual (Blueprint)

1. **Push the repo to GitHub** (the `backend/` folder is tracked; `android/` is not).

2. **Create the service from the Blueprint**
   - Render Dashboard → **New → Blueprint** → select this repo.
   - Render reads `render.yaml` and creates `myapp-otp-server`.
   - When prompted, fill the `sync: false` secrets:
     - `SUPABASE_URL` — your project URL (`https://<project-id>.supabase.co`)
     - `SUPABASE_SERVICE_ROLE_KEY` — the **service role** key (server-side only)
     - `MSG91_AUTHKEY` — your MSG91 auth key

3. **Deploy** and wait for the green **Live** status. Note the URL, e.g.
   `https://myapp-otp-server.onrender.com`.

4. **Verify**
   ```bash
   curl https://<your-service>.onrender.com/health
   # → {"status":"ok","timestamp":"..."}

   curl -X POST https://<your-service>.onrender.com/app/update/check \
     -H 'Content-Type: application/json' \
     -d '{"platform":"android","currentVersionCode":6}'
   # → {"hasUpdate":true,"versionName":"1.0.6","versionCode":7,...}
   ```

### Updating the served version later
Edit the `APP_*` env vars (Render dashboard **or** `render.yaml`) and redeploy.
`APP_LATEST_VERSION_CODE` must **strictly increase** or clients won't see the update.

> **Free plan:** the service sleeps after ~15 min idle; the first request then
> takes ~30s (longer than the app's 10s update-check timeout, so that one check
> is skipped harmlessly). Use `plan: starter` for always-on.

---

## Part B — Point the app at production

In `.env` (baked into the release APK):

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>

UPDATE_API_URL=https://<your-service>.onrender.com
UPDATE_CHECK_INTERVAL=14400000
```

- Use the **anon** key in the client — never the service role key.
- `UPDATE_API_URL` must be `https://`. The Android network security config blocks
  cleartext to any host except loopback.

---

## Part C — Create a release keystore (one time)

The release build uses `android/keystore.properties` when present, else falls back
to the debug keystore.

```bash
cd android
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore -alias myapp-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

Create `android/keystore.properties` (git-ignored, **never commit**):

```properties
storeFile=release.keystore
storePassword=<your-store-password>
keyAlias=myapp-release
keyPassword=<your-key-password>
```

> Back up `release.keystore` and the passwords. Losing them means you can no
> longer publish updates under the same identity.

See `keystore.properties.example` (copy it to `android/keystore.properties`).

---

## Part D — Build the signed production APK

```bash
npm run build:apk
```

Output: `android/app/build/outputs/apk/release/app-release.apk`.

The JS bundle and `.env` values are baked in, so rebuild whenever either changes.

---

## Part E — Publish and roll out the update

1. Bump the version in `android/app/build.gradle`, `app.json`, `.env`
   (`APP_VERSION_NAME` / `APP_VERSION_CODE`) and `package.json`.
2. `npm run build:apk`.
3. Create a GitHub Release tagged `v<version>` and attach `app-release.apk`.
4. Update the backend `APP_LATEST_VERSION_*` and `APP_DOWNLOAD_URL_ANDROID`
   to match, then redeploy.
5. Installed apps pick the update up on their next check and install it in-app.

---

## Operational notes

- **OTP storage is in-memory.** Pending OTPs are lost on restart/redeploy, and
  rate-limit counters reset. Fine for a single instance; move `otpStore` to a
  Supabase table if you scale out or need persistence.
- **HTTPS is enforced** when `NODE_ENV=production` (via `X-Forwarded-Proto`),
  except `/health` so platform probes pass.
- **Secrets** live only in the host's environment — never in `render.yaml` or git.
