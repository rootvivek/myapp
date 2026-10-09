import { useEffect } from 'react';
import { View } from 'react-native';
import {
  startAutoUpdateCheck,
  stopAutoUpdateCheck,
  configureAutoUpdate,
  checkForUpdates,
} from '../services/autoUpdate';

// @ts-ignore react-native-dotenv exposes the app's build-time environment values.
import {
  UPDATE_API_URL,
  UPDATE_CHECK_INTERVAL,
  ENABLE_APK_UPDATE,
  AUTO_DOWNLOAD_APK,
  SHOW_RELEASE_NOTES,
} from '@env';

/**
 * Enables the update check for the whole app: once on start and then
 * periodically. Renders nothing.
 *
 * Configuration lives in `.env`:
 * - UPDATE_API_URL: update check API base URL (required for APK updates)
 * - UPDATE_CHECK_INTERVAL: check interval in ms (default 4 hours)
 * - ENABLE_APK_UPDATE: enable APK update checks
 * - AUTO_DOWNLOAD_APK: auto-download the APK when an update is found
 * - SHOW_RELEASE_NOTES: show release notes in the update dialog
 */
export function AutoUpdateInitializer() {
  useEffect(() => {
    const apiUrl = String(UPDATE_API_URL ?? '').trim();

    configureAutoUpdate({
      apiUrl: apiUrl || 'https://api.yourdomain.com',
      checkInterval: parseInt(UPDATE_CHECK_INTERVAL || '14400000', 10),
      enableApkUpdate: ENABLE_APK_UPDATE !== 'false' && apiUrl.length > 0,
      autoDownloadApk: AUTO_DOWNLOAD_APK !== 'false',
      showReleaseNotes: SHOW_RELEASE_NOTES !== 'false',
    });

    startAutoUpdateCheck();
    void checkForUpdates(false);

    return () => {
      stopAutoUpdateCheck();
    };
  }, []);

  return <View />;
}
