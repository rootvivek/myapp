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
 *   "downloadUrl": "https://your-cdn.com/app-release-v1.0.5.apk",
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
 * Backend Implementation Example (Node.js/Express):
 * 
 * app.post('/app/update/check', (req, res) => {
 *   const { platform, currentVersionCode, packageName } = req.body;
 *   
 *   // Get latest version from your database/config
 *   const latest = getLatestVersion(platform);
 *   
 *   if (latest.versionCode > currentVersionCode) {
 *     return res.json({
 *       hasUpdate: true,
 *       versionName: latest.versionName,
 *       versionCode: latest.versionCode,
 *       downloadUrl: latest.downloadUrl,
 *       releaseNotes: latest.releaseNotes,
 *       mandatory: latest.mandatory,
 *       minVersionCode: latest.minVersionCode,
 *     });
 *   }
 *   
 *   res.json({ hasUpdate: false });
 * });
 * 
 * 
 * APK Hosting Options:
 * 1. GitHub Releases (free, but rate limited)
 * 2. AWS S3 + CloudFront (scalable, paid)
 * 3. Firebase Hosting (free tier available)
 * 4. Your own server/CDN
 * 
 * For GitHub Releases, use: https://github.com/username/repo/releases/download/v1.0.5/app-release.apk
 */

// Example: Version tracking in a simple JSON file (host on your CDN/server)
export const versionManifest = {
  android: {
    versionName: '1.0.5',
    versionCode: 6,
    downloadUrl: 'https://your-cdn.com/app-release-v1.0.5.apk',
    releaseNotes: '- Added auto-update feature\n- Fixed customer screen UI\n- Improved performance',
    mandatory: false,
    minVersionCode: 4,
    updatedAt: '2026-09-28T00:00:00Z',
  },
  ios: {
    versionName: '1.0.5',
    buildNumber: '6',
    appStoreUrl: 'https://apps.apple.com/app/idXXXXXXXXX',
    releaseNotes: '- Added auto-update feature\n- Fixed customer screen UI\n- Improved performance',
    mandatory: false,
  },
};

export default versionManifest;