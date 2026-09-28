import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useAutoUpdate, startAutoUpdateCheck, configureAutoUpdate } from '../services/autoUpdate';

/**
 * AutoUpdateInitializer
 * 
 * Drop this component at the root of your app (inside AuthProvider) to enable
 * automatic update checking on app start and periodically.
 * 
 * Usage:
 * <AuthProvider>
 *   <AutoUpdateInitializer />
 *   <Navigation />
 * </AuthProvider>
 */
export function AutoUpdateInitializer() {
  const { checkForUpdates } = useAutoUpdate();

  useEffect(() => {
    // Configure with your actual API endpoint
    configureAutoUpdate({
      apiUrl: 'https://api.yourdomain.com', // Replace with your API
      checkInterval: 4 * 60 * 60 * 1000, // 4 hours
      enableCodePush: false, // Set true if using CodePush
      enableApkUpdate: true,
      autoDownloadApk: true,
      showReleaseNotes: true,
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

// Need to import Text and Pressable
import { Text, Pressable } from 'react-native';