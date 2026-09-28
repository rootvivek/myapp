import React, { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import {
  useAutoUpdate,
  startAutoUpdateCheck,
  configureAutoUpdate,
} from '../services/autoUpdate';

// @ts-ignore react-native-dotenv exposes the app's build-time environment values.
import {
  UPDATE_API_URL,
  UPDATE_CHECK_INTERVAL,
  ENABLE_CODE_PUSH,
  ENABLE_APK_UPDATE,
  AUTO_DOWNLOAD_APK,
  SHOW_RELEASE_NOTES,
} from '@env';

/**
 * AutoUpdateInitializer
 * 
 * Drop this component at the root of your app (inside AuthProvider) to enable
 * automatic update checking on app start and periodically.
 * 
 * Configuration via .env:
 * - UPDATE_API_URL: Your update check API endpoint
 * - UPDATE_CHECK_INTERVAL: Check interval in ms (default 4 hours)
 * - ENABLE_CODE_PUSH: Enable CodePush for JS updates
 * - ENABLE_APK_UPDATE: Enable APK update checks
 * - AUTO_DOWNLOAD_APK: Auto-download APK when update found
 * - SHOW_RELEASE_NOTES: Show release notes in update dialog
 */
export function AutoUpdateInitializer() {
  const { checkForUpdates } = useAutoUpdate();

  useEffect(() => {
    // Configure from environment variables (.env via react-native-dotenv)
    configureAutoUpdate({
      apiUrl: UPDATE_API_URL || 'https://api.yourdomain.com',
      checkInterval: parseInt(UPDATE_CHECK_INTERVAL || '14400000', 10),
      enableCodePush: ENABLE_CODE_PUSH === 'true',
      enableApkUpdate: ENABLE_APK_UPDATE !== 'false',
      autoDownloadApk: AUTO_DOWNLOAD_APK !== 'false',
      showReleaseNotes: SHOW_RELEASE_NOTES !== 'false',
    });

    // Start periodic checks
    startAutoUpdateCheck();

    // Initial check
    checkForUpdates(false);

    // Cleanup on unmount (rarely needed for root component)
    return () => {
      // stopAutoUpdateCheck() if needed
    };
  }, [checkForUpdates]);

  return <View />;
}

/**
 * UpdateBanner - Shows a banner when update is available
 * 
 * Usage: Place anywhere in your app (e.g., HomeDashboardScreen)
 * <UpdateBanner />
 */
export function UpdateBanner() {
  const { state, info, checkForUpdates } = useAutoUpdate();

  if (state !== 'ready' || !info) return null;

  return (
    <View
      style={{
        backgroundColor: '#8B5CF6',
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>
          Update Available
        </Text>
        <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>
          Version {info.versionName} is ready to install
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Pressable
          onPress={() => checkForUpdates(true)}
          style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
        >
          <Text style={{ color: '#8B5CF6', fontWeight: '700' }}>Update Now</Text>
        </Pressable>
      </View>
    </View>
  );
}