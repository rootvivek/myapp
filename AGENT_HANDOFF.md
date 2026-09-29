# Agent Handoff & Project Context Guide

> **Generated on:** 2026-09-27  
> **Repository:** `myapp` (Mobile Application: MCA Phone Wala)  
> **Platform / Environment:** React Native `0.79.2`, React `19.0.0`, TypeScript `~5.9.2`, Node `>=18`, macOS (Darwin)

---

## 1. Project Overview & Business Domain

**MCA Phone Wala** is a React Native mobile application for mobile phone repair shops. It provides comprehensive shop management features:
- **Repair Job Tracking**: Creation, status lifecycle (`Pending`, `In Progress`, `Waiting for Parts`, `Ready for Pickup`, `Completed`, `Cancelled`), hardware/issue logs, accessory tracking, photo attachments, IMEI scanning, and search.
- **Finance & Accounting**: Revenue tracking, advance payments, dues collection, profit/loss calculations, expense tracking, and labour earnings breakdown.
- **Inventory Management**: Spare parts catalog, stock tracking, automatic deduction when parts are consumed in repair jobs, and WhatsApp customer updates.
- **Customer Directory**: Customer history, call shortcuts (`dialPhone`), repair logs, and invoices.
- **Authentication & Multi-Tenant Shop Model**:
  - Roles: `owner`, `labour`, `admin`.
  - Supabase authentication with phone-based OTP / password logins.
  - Multi-tenant data isolation via `shop_id` and Supabase Row Level Security (RLS).
  - Labour account provisioning managed by shop owners.
- **Receipts & Invoicing**: PDF invoice generation (`react-native-html-to-pdf`) and sharing (`react-native-share`).

---

## 2. Tech Stack & Key Libraries

| Layer | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Framework** | React Native 0.79.2 (bare / Expo config hybrid) | Core mobile app framework |
| **Language** | TypeScript ~5.9.2 | Type-safe code |
| **Backend & DB** | Supabase (`@supabase/supabase-js` v2.108.0) | Auth, PostgreSQL database, Realtime subscriptions, RLS |
| **State / Navigation** | `@react-navigation/native` v7, Native Stack v7 | Navigation stack & tabs |
| **UI Kit & Styling** | `react-native-paper` MD3, `react-native-linear-gradient`, `lucide-react-native` | Material theme, custom styling, icons |
| **Camera & Barcode** | `react-native-vision-camera` v4.7.3 | IMEI and QR/barcode scanning |
| **OTP Service** | `@msg91comm/sendotp-react-native` + Express OTP backend (`backend/otp-server.js`) | Phone OTP verification & onboarding |
| **PDF & Sharing** | `react-native-html-to-pdf`, `react-native-share` | Bill generation & customer communication |
| **Date & Time** | `@react-native-community/datetimepicker` | Date pickers for invoices & filters |

---

## 3. Architecture & Directory Structure

```
myapp/
├── App.tsx                     # Root app component (Providers: Theme, Auth, Repairs, Inventory)
├── app.json                    # App config metadata (com.myapp / MCA Phone Wala)
├── backend/                    # Node.js Express companion service
│   ├── otp-server.js           # Phone OTP verification endpoints
│   ├── migrate-users-to-phone.js # Migration script from email to phone auth
│   └── package.json            # Express server dependencies
├── patches/                    # Patches applied via patch-package
│   ├── @msg91comm+sendotp-react-native+3.0.0.patch
│   ├── react-native-html-to-pdf+1.3.0.patch
│   └── react-native-screens+4.24.0.patch
├── scripts/                    # Build & utility scripts (sync-android-jdk, run-with-jdk)
├── supabase/
│   └── schema.sql              # Supabase PostgreSQL schema with RLS and trigger definitions
└── src/
    ├── auth/                   # Auth logic & services
    │   ├── AuthProvider.tsx    # Auth context implementation
    │   ├── AuthService.ts      # Supabase signIn, signUp, and session handlers
    │   ├── LabourService.ts    # Labour staff user management
    │   ├── ProfileService.ts   # Profile fetching & updates
    │   ├── ShopService.ts      # Shop creation & membership logic
    │   └── types.ts            # Auth & user types
    ├── components/             # Reusable UI components
    │   ├── BottomNavBar.tsx    # Bottom navigation bar (Home, Inventory, Finance, User)
    │   ├── ComingSoon.tsx      # Modal / toast for WIP features
    │   ├── CustomerHistoryModal.tsx
    │   ├── RepairCard/         # Modular repair cards for list views
    │   └── Skeleton.tsx        # Loading skeleton screens
    ├── context/                # React Context Providers
    │   ├── AuthContext.tsx     # Re-exports from src/auth
    │   ├── InventoryContext.tsx# Inventory items state and actions
    │   ├── RepairsContext.tsx  # Repairs store with throttled refresh & realtime sync
    │   └── ThemeContext.tsx    # Dark/Light theme provider
    ├── db/                     # Data access layer (Repositories)
    │   ├── customerRepository.ts
    │   ├── database.ts         # Data mappings & helper queries
    │   ├── helpers.ts          # Generic database helpers & pagination
    │   ├── inventoryRepository.ts # CRUD for inventory stock
    │   ├── profileRepository.ts
    │   ├── repairRepository.ts # CRUD and queries for repairs
    │   └── supabaseData.ts
    ├── lib/
    │   ├── supabase.ts         # Supabase client instantiation
    │   └── supabaseAuthStorage.ts # AsyncStorage adapter for Supabase session storage
    ├── navigation/
    │   ├── AppNavigator.tsx    # Native stack definitions
    │   └── types.ts            # RootStackParamList types
    ├── screens/                # Application screens
    │   ├── AddRepair/          # New repair multi-step / form sub-components
    │   ├── AddRepairScreen.tsx
    │   ├── AdminDashboard.tsx
    │   ├── AuthScreen.tsx      # Sign In / Sign Up tabbed view
    │   ├── CustomerDirectoryScreen.tsx # Customer list with search & phone dialing
    │   ├── FinanceScreen.tsx   # Financial breakdown, income, dues
    │   ├── HomeDashboardScreen.tsx # High-level dashboard with service tiles
    │   ├── HomeScreen.tsx      # Active repair list with filter chips
    │   ├── InventoryScreen.tsx # Inventory management
    │   ├── MainTabScreen.tsx   # Tab container switching between dashboard/tabs
    │   ├── ManageLabour/       # Staff management
    │   ├── ManageLabourScreen.tsx
    │   ├── RepairDetail/       # Detailed repair view components
    │   ├── RepairDetailScreen.tsx
    │   ├── ScanImeiScreen.tsx  # Camera scanner for IMEI barcodes
    │   ├── ScanQrScreen.tsx    # QR scanner
    │   ├── SearchScreen.tsx    # Deep search across repairs & customers
    │   └── SettingsScreen.tsx  # User profile & shop configurations
    ├── services/
    │   └── repairService.ts    # Business logic layer for repair status & sync
    ├── theme.ts                # Design tokens, color palette, typography
    ├── types/                  # Shared data types (repair.ts, inventory.ts, profile.ts)
    └── utils/
        ├── format.ts           # Currency (INR) and date formatting, parseMoney
        ├── logger.ts           # Unified logger with DEV checks
        ├── phone.ts            # Safe phone dialing helper (dialPhone)
        ├── receipt.ts          # PDF bill generation
        └── validation.ts       # Form validators
```


---

## 4. Current State & Recent Changes (Working Directory)

### Major UI & Flow Adjustments
1. **Unauthenticated Dashboard Experience (`App.tsx` & `MainTabScreen.tsx`)**:
   - The app boots directly to `HomeDashboardScreen` even for unauthenticated users (guest mode).
   - Guests can see the landing view and service catalog.
   - Accessing repair operations (creating repairs or inspecting details) routes the guest to the `User` tab (`AuthScreen`) to log in or sign up.
   - Once authenticated, the user is navigated directly into active repairs (`jobs`).
   - Bottom navigation bar appears only for authenticated users, and displays: `Home` (repairs list), `Inventory`, `Finance` (owner only), and `User` (profile).

2. **Refactored & Centralized Utilities**:
   - Standardized `dialPhone(phone: string)` in `src/utils/phone.ts` replacing duplicated `Linking.openURL` across `CustomerDirectoryScreen`, `FinanceScreen`, and `RepairDetailScreen`.
   - Consolidated `parseMoney` into `src/utils/format.ts` to replace redundant parse implementations.

3. **Untracked / Added Files**:
   - `src/components/ComingSoon.tsx`: Alert dialog for features under development.
   - `src/screens/HomeDashboardScreen.tsx`: New home tile screen showing services (Repair, Battery, Accessories, Buy/Sell, etc.).
   - `patches/@msg91comm+sendotp-react-native+3.0.0.patch`: Android build fixes for the MSG91 SendOTP library.

4. **Cleaned Up Files**:
   - Removed obsolete components (`OfflineBanner.tsx`, `ThreeDIcon.tsx`, and dead finance subcomponents consolidated into `FinanceScreen.tsx`).
   - Removed temporary logs (`assemble.log`, `compile.log`, `window_dump.xml`).

5. **Auto-Update System (Android)**:
   - `src/services/autoUpdate.ts`: checks a backend endpoint, downloads the APK into the app's
     private files dir (`RNFS.DocumentDirectoryPath`, always writable under scoped storage) and
     hands it to the system installer via `react-native-file-viewer` (whose FileProvider exposes
     `<files-path>`). Supports optional CodePush (`ENABLE_CODE_PUSH`).
   - **Native requirements** (in `android/app/src/main/`):
     - `AndroidManifest.xml`: `android.permission.REQUEST_INSTALL_PACKAGES` (installer prompt)
       and `android:networkSecurityConfig="@xml/network_security_config"`.
     - `res/xml/network_security_config.xml`: permits cleartext only for `localhost`, `127.0.0.1`
       and `10.0.2.2` (the local HTTP backend); production must use HTTPS.
   - The download runs with `background: false` on purpose — RNFS's `background: true` uses
     Android's DownloadManager, which can only write to public external storage.
   - `src/components/AutoUpdateInitializer.tsx`: mounted in `App.tsx`; configures the service
     from `.env` and starts periodic checks. Also exports an `UpdateBanner` component.
   - `src/services/updateApiSpec.ts`: API contract/docs for `POST /app/update/check`.
   - `backend/otp-server.js`: implements `POST /app/update/check` (version served from `backend/.env`).
   - **Publishing:** manual — build locally (`npm run build:apk`), then create/update a GitHub Release
     and attach the APK so the asset URL matches `backend/.env`'s `APP_DOWNLOAD_URL_ANDROID`
     (e.g. `https://github.com/rootvivek/myapp/releases/download/v1.0.5/app-release.apk`).
     NOTE: the `android/` folder is **not tracked in git** (`.gitignore` line 48), so GitHub Actions
     cannot build the APK — CI-based releases are not possible without committing `android/`.
   - Env config uses **`react-native-dotenv`** (`@env` imports) — NOT `react-native-config`.
     Types live in `src/types/env.d.ts`. Required vars: `UPDATE_API_URL`, `UPDATE_CHECK_INTERVAL`,
     `ENABLE_CODE_PUSH`, `ENABLE_APK_UPDATE`, `AUTO_DOWNLOAD_APK`, `SHOW_RELEASE_NOTES`,
     `APP_VERSION_NAME`, `APP_VERSION_CODE` (see `.env`).

6. **Testing & Tooling**:
   - Jest + `@testing-library/react-native` configured (`jest.config.js`, `jest.setup.js`).
   - Run tests with `npm test`. Typecheck with `npx tsc --noEmit`.

7. **Typecheck Status**:
   - `npx tsc --noEmit` passes with 0 errors.

---

## 5. Environment & Local Setup

### `.env` Variables (Client)
Required in the project root:
```env
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
```

### `backend/.env` Variables (OTP Server)
Required in `backend/`:
```env
PORT=3001
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-secret-key>
MSG91_AUTH_KEY=<optional-msg91-key>
```

### Running the App
- **Start Metro Bundler**:
  ```bash
  npm start
  ```
- **Run on Android**:
  ```bash
  npm run android
  ```
- **Build Android Release APK**:
  ```bash
  npm run apk
  # or
  npm run build:apk
  ```
- **Sync JDK for Android**:
  ```bash
  npm run sync:jdk
  ```
- **Start Backend OTP Server**:
  ```bash
  cd backend && npm start
  ```

---

## 6. Database Schema & RLS Policies Summary

- **`shops`**: Stores shop profiles (`id`, `shop_name`, `owner_id`, `phone`, `created_at`).
- **`profiles`**: User profiles linked to `auth.users` (`id`, `role`: `owner` | `labour` | `admin`, `shop_id`, `full_name`, `phone`, `avatar_url`).
- **`repairs`**: Core job table (`id`, `shop_id`, `customer_name`, `phone`, `brand`, `model`, `issue`, `status`, `cost`, `advance`, `created_at`, `inventory_items_used`, etc.).
- **`inventory`**: Parts catalog (`id`, `shop_id`, `name`, `sku`, `quantity`, `cost_price`, `selling_price`, `low_stock_threshold`).
- **RLS Policy convention**:
  - Always uses `public.get_user_shop_id(auth.uid())` and `public.get_user_role(auth.uid())` to prevent RLS recursive query locks.
  - Owners have full read/write on all records in their `shop_id`.
  - Labour staff are restricted from viewing owner-only financial aggregates and staff passwords.

---

## 7. Next Steps & Recommendations for Incoming Agent

1. **Commit the Auto-Update Feature**:
   - Stage and commit the auto-update work: `src/services/autoUpdate.ts`,
     `src/components/AutoUpdateInitializer.tsx`, `src/services/updateApiSpec.ts`,
     `src/types/env.d.ts`, `src/types/codepush.d.ts`, `backend/.env.example`,
     `backend/otp-server.js`, `scripts/test-update-check.js`,
     `jest.config.js`, `jest.setup.js`, `src/__tests__/`, and the `.env` template.
   - Keep `patches/@msg91comm+sendotp-react-native+3.0.0.patch` (Android build fix).
2. **Configure Production Update Endpoint**:
   - Set `UPDATE_API_URL` in `.env` to a URL the phone can reach. `localhost` only works on an
     Android *emulator* via `adb reverse tcp:3001 tcp:3001`; a physical device needs your LAN IP
     (e.g. `http://192.168.x.x:3001`) or a deployed backend.
   - Keep `backend/.env`'s `APP_LATEST_VERSION_*` and `APP_DOWNLOAD_URL_ANDROID` in sync with the
     GitHub Release you publish. **VersionCode must strictly increase** or no update is detected.
   - Env vars are read via `react-native-dotenv`; adding a new var requires restarting Metro
     with a cache reset (`npm start -- --reset-cache`).
3. **Release Checklist** (manual, since `android/` is not in git):
   - Bump `versionName`/`versionCode` in `android/app/build.gradle`, plus `app.json`,
     `package.json`, `.env` (`APP_VERSION_*`).
   - `npm run build:apk`
   - Create a GitHub Release tagged `v<version>` and attach
     `android/app/build/outputs/apk/release/app-release.apk`.
   - Update `backend/.env` (`APP_LATEST_VERSION_NAME`, `APP_LATEST_VERSION_CODE`,
     `APP_DOWNLOAD_URL_ANDROID`) and restart the backend.
4. **Jest**:
   - Configured (`jest.config.js` + `jest.setup.js`); run `npm test`. Note: component tests that
     import `react-native` require `babel-jest` instead of `ts-jest` (currently only pure
     TypeScript util tests are wired).
5. **Android Build Verification**:
   - Ensure `npm run sync:jdk` has been executed if running Gradle tasks locally on macOS.
   - Do NOT reintroduce `react-native-config` without its Gradle plugin — the plugin
     (`com.lugg:react-native-config-gradle-plugin`) is not resolvable in this environment.
6. **Service Tiles Completion**:
   - `HomeDashboardScreen.tsx` currently has `Repair` live; other tiles trigger `showComingSoon()`. Future roadmap will wire accessories, battery, and trade-in workflows.

---

## 8. Troubleshooting: Android Release Build (`npm run build:apk`)

The build runs Hermes bytecode compilation, which is memory-hungry. Two failures seen and their fixes:

1. **`Process 'hermesc' finished with non-zero exit value 137`**
   - Cause: the OS killed `hermesc` due to low memory (137 = SIGKILL).
   - Free memory before building: close the Android emulator (`adb emu kill`, then
     `pkill -9 -f qemu-system-aarch64`) and stale Gradle daemons
     (`./gradlew --stop`). Verify with `vm_stat` that free + inactive memory is healthy
     (build needs several GB).
   - `android/gradle.properties` already sets `org.gradle.jvmargs=-Xmx4096m`.

2. **`Couldn't determine Hermesc location ... node_modules/react-native/sdks/hermesc/%OS-BIN%/hermesc`**
   - Cause: `node_modules/react-native/sdks/hermesc/osx-bin/hermesc` was missing (only
     `hermes` / `hermes-lit` present).
   - Fix (restore from the official package tarball):
     ```bash
     cd /tmp && mkdir rn-restore && cd rn-restore
     curl -sL "https://registry.npmjs.org/react-native/-/react-native-0.79.2.tgz" -o rn.tgz
     tar xzf rn.tgz package/sdks/hermesc/osx-bin/hermesc
     cp package/sdks/hermesc/osx-bin/hermesc \
       /Users/vivek/Downloads/myapp/node_modules/react-native/sdks/hermesc/osx-bin/
     chmod +x /Users/vivek/Downloads/myapp/node_modules/react-native/sdks/hermesc/osx-bin/hermesc
     ```
   - Alternatively, reinstall the package: `npm install react-native@0.79.2 --legacy-peer-deps`.

3. **Hermes disabled path**: setting `hermesEnabled=false` in `android/gradle.properties`
   avoids `hermesc` entirely (uses JSC) but changes the runtime engine — prefer fixing memory
   or restoring `hermesc` instead.

Output APK: `android/app/build/outputs/apk/release/app-release.apk`.

