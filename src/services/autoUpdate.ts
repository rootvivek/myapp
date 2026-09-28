import { Platform, Alert, Linking, AppRegistry } from 'react-native';
import RNFS from 'react-native-fs';
import { AppVersion, Build } from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================================
// Types
// ============================================================================

export interface UpdateInfo {
  hasUpdate: boolean;
  versionName: string;
  versionCode: number;
  downloadUrl: string;
  releaseNotes?: string;
  mandatory?: boolean;
  minVersionCode?: number;
}

export interface CodePushUpdateInfo {
  hasUpdate: boolean;
  label?: string;
  packageSize?: number;
  failedInstall?: boolean;
  mandatory?: boolean;
}

export type UpdateChannel = 'production' | 'staging' | 'development';

export interface UpdateConfig {
  apiUrl: string;
  codePushKey?: string;
  checkInterval: number; // ms
  enableCodePush: boolean;
  enableApkUpdate: boolean;
  autoDownloadApk: boolean;
  showReleaseNotes: boolean;
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: UpdateConfig = {
  apiUrl: 'https://api.yourdomain.com', // Replace with your API
  codePushKey: undefined, // Add CodePush deployment key if using
  checkInterval: 4 * 60 * 60 * 1000, // 4 hours
  enableCodePush: false,
  enableApkUpdate: true,
  autoDownloadApk: true,
  showReleaseNotes: true,
};

let config: UpdateConfig = { ...DEFAULT_CONFIG };
let updateCheckTimer: ReturnType<typeof setTimeout> | null = null;
let isChecking = false;

// ============================================================================
// Config Management
// ============================================================================

export function configureAutoUpdate(userConfig: Partial<UpdateConfig>) {
  config = { ...config, ...userConfig };
}

export function getUpdateConfig(): UpdateConfig {
  return { ...config };
}

// ============================================================================
// Current App Version
// ============================================================================

async function getCurrentVersion(): Promise<{ versionName: string; versionCode: number }> {
  try {
    // Try to get from native build config
    const versionName = AppVersion?.versionName || '1.0.0';
    const versionCode = Build?.versionCode || 1;
    return { versionName, versionCode: parseInt(versionCode.toString(), 10) };
  } catch {
    // Fallback to package.json
    return { versionName: '1.0.4', versionCode: 5 };
  }
}

// ============================================================================
// CodePush Integration (Optional)
// ============================================================================

let codePush: any = null;

async function loadCodePush() {
  if (!config.enableCodePush) return null;
  try {
    codePush = await import('react-native-code-push');
    return codePush.default || codePush;
  } catch {
    console.warn('[AutoUpdate] CodePush not installed. Run: npm i react-native-code-push');
    return null;
  }
}

export async function checkCodePushUpdate(): Promise<CodePushUpdateInfo> {
  const cp = await loadCodePush();
  if (!cp) return { hasUpdate: false };

  try {
    const update = await cp.checkForUpdate(config.codePushKey || '');
    if (update) {
      return {
        hasUpdate: true,
        label: update.label,
        packageSize: update.packageSize,
        mandatory: update.isMandatory,
        failedInstall: update.failedInstall,
      };
    }
    return { hasUpdate: false };
  } catch (error) {
    console.error('[AutoUpdate] CodePush check failed:', error);
    return { hasUpdate: false };
  }
}

export async function syncCodePush(): Promise<boolean> {
  const cp = await loadCodePush();
  if (!cp) return false;

  try {
    await cp.sync({
      deploymentKey: config.codePushKey,
      updateDialog: {
        appendReleaseDescription: true,
        descriptionPrefix: '\n\nChanges:\n',
      },
      installMode: cp.InstallMode.ON_NEXT_RESTART,
      minimumBackgroundDuration: 30 * 1000,
    });
    return true;
  } catch (error) {
    console.error('[AutoUpdate] CodePush sync failed:', error);
    return false;
  }
}

// ============================================================================
// APK Update Check
// ============================================================================

async function fetchLatestVersion(): Promise<UpdateInfo> {
  const { versionName, versionCode } = await getCurrentVersion();

  try {
    const response = await fetch(`${config.apiUrl}/app/update/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        platform: Platform.OS,
        currentVersionCode: versionCode,
        currentVersionName: versionName,
        packageName: 'com.myapp',
      }),
    });

    if (!response.ok) {
      throw new Error(`Update check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      hasUpdate: data.hasUpdate === true,
      versionName: data.versionName || versionName,
      versionCode: data.versionCode || versionCode,
      downloadUrl: data.downloadUrl || '',
      releaseNotes: data.releaseNotes,
      mandatory: data.mandatory === true,
      minVersionCode: data.minVersionCode,
    };
  } catch (error) {
    console.error('[AutoUpdate] Failed to check for APK update:', error);
    return { hasUpdate: false, versionName, versionCode, downloadUrl: '' };
  }
}

// ============================================================================
// APK Download & Install
// ============================================================================

const APK_FILENAME = 'app-update.apk';
const APK_PATH = `${RNFS.DownloadDirectoryPath}/${APK_FILENAME}`;

async function downloadApk(url: string, onProgress?: (progress: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      fromUrl: url,
      toFile: APK_PATH,
      background: true,
      progressDivider: 5,
      progress: (res: any) => {
        const progress = res.bytesWritten / res.contentLength;
        onProgress?.(progress);
      },
    };

    RNFS.downloadFile(options)
      .promise.then((result: any) => {
        if (result.statusCode === 200) {
          resolve(APK_PATH);
        } else {
          reject(new Error(`Download failed with status ${result.statusCode}`));
        }
      })
      .catch(reject);
  });
}

export async function installApk(apkPath: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('APK install only supported on Android');
  }

  // Use react-native-file-viewer or intent to install
  try {
    const { default: FileViewer } = await import('react-native-file-viewer');
    await FileViewer.open(apkPath, { showOpenWithDialog: true });
  } catch {
    // Fallback: Use intent via Linking
    const fileUrl = `file://${apkPath}`;
    const supported = await Linking.canOpenURL(fileUrl);
    if (supported) {
      await Linking.openURL(fileUrl);
    } else {
      throw new Error('Cannot open APK file for installation');
    }
  }
}

// ============================================================================
// Update Manager
// ============================================================================

let updateState: 'idle' | 'checking' | 'downloading' | 'ready' | 'error' = 'idle';
let updateProgress = 0;
let latestUpdateInfo: UpdateInfo | null = null;
const listeners = new Set<(state: typeof updateState, progress: number, info: UpdateInfo | null) => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb(updateState, updateProgress, latestUpdateInfo));
}

export function addUpdateListener(
  cb: (state: typeof updateState, progress: number, info: UpdateInfo | null) => void
) {
  listeners.add(cb);
  cb(updateState, updateProgress, latestUpdateInfo);
  return () => listeners.delete(cb);
}

export function getUpdateState() {
  return { state: updateState, progress: updateProgress, info: latestUpdateInfo };
}

// ============================================================================
// Main Update Check Function
// ============================================================================

export async function checkForUpdates(showAlert = true): Promise<{
  hasUpdate: boolean;
  type: 'codepush' | 'apk' | 'none';
  info?: UpdateInfo | CodePushUpdateInfo;
}> {
  if (isChecking) return { hasUpdate: false, type: 'none' };
  isChecking = true;
  updateState = 'checking';
  updateProgress = 0;
  notifyListeners();

  try {
    // 1. Check CodePush first (instant JS updates)
    if (config.enableCodePush) {
      const cpUpdate = await checkCodePushUpdate();
      if (cpUpdate.hasUpdate) {
        latestUpdateInfo = cpUpdate as any;
        updateState = 'ready';
        notifyListeners();

        if (showAlert) {
          showUpdateAlert('New Update Available', 'A new version is ready. Restart the app to apply changes.', () =>
            syncCodePush()
          );
        }
        return { hasUpdate: true, type: 'codepush', info: cpUpdate };
      }
    }

    // 2. Check APK update
    if (config.enableApkUpdate && Platform.OS === 'android') {
      const apkUpdate = await fetchLatestVersion();
      if (apkUpdate.hasUpdate && apkUpdate.downloadUrl) {
        latestUpdateInfo = apkUpdate;
        updateState = 'ready';
        notifyListeners();

        if (config.autoDownloadApk) {
          await downloadAndPrepareApk(apkUpdate);
        } else if (showAlert) {
          showUpdateAlert(
            'App Update Available',
            apkUpdate.releaseNotes
              ? `Version ${apkUpdate.versionName} is available.\n\n${apkUpdate.releaseNotes}`
              : `Version ${apkUpdate.versionName} is available.`,
            () => downloadAndPrepareApk(apkUpdate),
            apkUpdate.mandatory
          );
        }
        return { hasUpdate: true, type: 'apk', info: apkUpdate };
      }
    }

    updateState = 'idle';
    latestUpdateInfo = null;
    notifyListeners();
    return { hasUpdate: false, type: 'none' };
  } catch (error) {
    console.error('[AutoUpdate] Check failed:', error);
    updateState = 'error';
    notifyListeners();
    return { hasUpdate: false, type: 'none' };
  } finally {
    isChecking = false;
  }
}

async function downloadAndPrepareApk(info: UpdateInfo) {
  updateState = 'downloading';
  updateProgress = 0;
  notifyListeners();

  try {
    await downloadApk(info.downloadUrl!, (progress) => {
      updateProgress = progress;
      notifyListeners();
    });

    updateState = 'ready';
    updateProgress = 1;
    notifyListeners();

    // Show install prompt
    Alert.alert(
      'Update Ready',
      `Version ${info.versionName} has been downloaded. Install now?`,
      [
        { text: 'Later', style: 'cancel' },
        {
          text: 'Install',
          onPress: async () => {
            try {
              await installApk(APK_PATH);
            } catch (error) {
              console.error('[AutoUpdate] Install failed:', error);
              Alert.alert('Install Failed', 'Could not open installer. Please install manually from Downloads.');
            }
          },
        },
      ],
      { cancelable: !info.mandatory }
    );
  } catch (error) {
    console.error('[AutoUpdate] Download failed:', error);
    updateState = 'error';
    notifyListeners();
    if (showAlert) {
      Alert.alert('Update Failed', 'Failed to download update. Please try again later.');
    }
  }
}

// ============================================================================
// UI Helpers
// ============================================================================

function showUpdateAlert(
  title: string,
  message: string,
  onConfirm: () => void,
  mandatory = false
) {
  const buttons = mandatory
    ? [{ text: 'Update Now', onPress: onConfirm }]
    : [
        { text: 'Later', style: 'cancel' as const },
        { text: 'Update Now', onPress: onConfirm },
      ];

  Alert.alert(title, message, buttons, { cancelable: !mandatory });
}

// ============================================================================
// Auto Check Scheduler
// ============================================================================

export function startAutoUpdateCheck() {
  if (updateCheckTimer) return;

  // Initial check after app stabilizes
  setTimeout(() => {
    checkForUpdates(false).catch(console.error);
  }, 5000);

  // Periodic checks
  updateCheckTimer = setInterval(() => {
    checkForUpdates(false).catch(console.error);
  }, config.checkInterval);

  console.log('[AutoUpdate] Auto-check started, interval:', config.checkInterval);
}

export function stopAutoUpdateCheck() {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
}

// ============================================================================
// Manual Trigger
// ============================================================================

export async function checkAndUpdate() {
  return checkForUpdates(true);
}

export async function installPendingUpdate() {
  if (latestUpdateInfo && updateState === 'ready' && latestUpdateInfo.downloadUrl) {
    await installApk(APK_PATH);
  }
}

// ============================================================================
// React Hook for Components
// ============================================================================

import { useEffect, useState } from 'react';

export function useAutoUpdate() {
  const [state, setState] = useState(getUpdateState());

  useEffect(() => {
    const unsubscribe = addUpdateListener((s, p, i) => setState({ state: s, progress: p, info: i }));
    return unsubscribe;
  }, []);

  return {
    ...state,
    checkForUpdates: () => checkForUpdates(true),
    installPendingUpdate,
    startAutoCheck: startAutoUpdateCheck,
    stopAutoCheck: stopAutoUpdateCheck,
  };
}