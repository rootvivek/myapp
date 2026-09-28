/**
 * Auto-Update API Specification
 *
 * POST /app/update/check
 *
 * Request Body:
 * {
 *   "platform": "android" | "ios",
 *   "currentVersionCode": 5,
 *   "currentVersionName": "1.0.4",
 *   "packageName": "com.myapp"
 * }
 *
 * Response (Update Available):
 * {
 *   "hasUpdate": true,
 *   "versionName": "1.0.5",
 *   "versionCode": 6,
 *   "downloadUrl": "https://github.com/username/repo/releases/download/v1.0.5/app-release.apk",
 *   "releaseNotes": "- Fixed login issue\n- Added dark mode\n- Performance improvements",
 *   "mandatory": false,
 *   "minVersionCode": 4
 * }
 *
 * Response (No Update):
 * {
 *   "hasUpdate": false
 * }
 *
 *
 * Backend Implementation:
 *
 * The endpoint is implemented in `backend/otp-server.js` at `/app/update/check`.
 * Configuration via environment variables in `backend/.env`:
 * - APP_LATEST_VERSION_NAME
 * - APP_LATEST_VERSION_CODE
 * - APP_DOWNLOAD_URL_ANDROID
 * - APP_DOWNLOAD_URL_IOS
 * - APP_RELEASE_NOTES
 * - APP_MANDATORY_UPDATE
 * - APP_MIN_VERSION_CODE
 *
 * Deployment:
 * 1. Set UPDATE_API_URL=http://your-backend:3001 in client .env
 * 2. Update backend/.env with new version info
 * 3. Restart backend server
 *
 * GitHub Actions (auto on tag push):
 * - `.github/workflows/release.yml` builds APK and creates GitHub Release
 * - Update backend/.env with new version after release
 */

// Example: Version tracking in a simple JSON file (host on your CDN/server)
export const versionManifest = {
  android: {
    versionName: '1.0.5',
    versionCode: 6,
    downloadUrl: 'https://github.com/rootvivek/myapp/releases/download/v1.0.5/app-release.apk',
    releaseNotes: '- Added auto-update feature\n- Fixed customer screen UI\n- Improved performance',
    mandatory: false,
    minVersionCode: 4,
    updatedAt: '2026-09-28T00:00:00Z',
  },
  ios: {
    versionName: '1.0.5',
    buildNumber: '6',
    appStoreUrl: 'https://apps.apple.com/app/idYOUR_APP_ID',
    releaseNotes: '- Added auto-update feature\n- Fixed customer screen UI\n- Improved performance',
    mandatory: false,
  },
};

export default versionManifest;