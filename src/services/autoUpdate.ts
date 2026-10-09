import { Platform, Alert, NativeModules } from 'react-native';
import RNFS from 'react-native-fs';
import FileViewer from 'react-native-file-viewer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// @ts-ignore react-native-dotenv exposes the app's build-time environment values.
import {
  UPDATE_API_URL,
  UPDATE_CHECK_INTERVAL,
  ENABLE_APK_UPDATE,
  AUTO_DOWNLOAD_APK,
  SHOW_RELEASE_NOTES,
  APP_VERSION_NAME,
  APP_VERSION_CODE,
} from '@env';

// ============================================================================
// API URL Resolution
// ============================================================================

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

/**
 * The update backend runs on the same machine as Metro during development.
 * Inside the app `localhost` points at the phone/emulator itself, which is why
 * a `http://localhost:3001` base URL fails with "Network request failed".
 *
 * Derive the development machine's address from Metro's script URL so the same
 * `.env` works on a physical device (LAN IP) and on an emulator (which reaches
 * the host through the 10.0.2.2 alias).
 */
function getDevServerHost(): string | null {
  try {
    const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
    const host = scriptURL?.match(/^https?:\/\/([^/:]+)/i)?.[1];
    if (host && !LOOPBACK_HOSTS.has(host.toLowerCase())) return host;
  } catch {
    // ignore and fall through to the emulator default
  }
  // Android emulator: 10.0.2.2 is an alias for the host machine's loopback.
  return Platform.OS === 'android' ? '10.0.2.2' : null;
}

/**
 * Resolve the update API base URL for the current runtime.
 *
 * A loopback base URL (`http://localhost:3001`) can never work from inside the
 * app: it points at the phone/emulator itself. When Metro is reachable we use
 * its host (the LAN IP a physical device uses); otherwise we fall back to the
 * Android emulator's host alias (10.0.2.2), which the network security config
 * permits over cleartext.
 *
 * This runs in release builds too, because the local-backend workflow installs a
 * release APK (`__DEV__ === false`) but still serves the backend from the dev
 * machine. Production builds configure a real `https://` URL, which is a
 * non-loopback host and is therefore returned verbatim.
 */
export function resolveApiBaseUrl(configured: string): string {
  const base = (configured || '').trim().replace(/\/+$/, '') || 'https://api.yourdomain.com';

  const match = base.match(/^(https?:\/\/)([^/:]+)(:\d+)?(\/.*)?$/i);
  if (!match) return base;

  const [, scheme, host, port = '', path = ''] = match;
  if (!LOOPBACK_HOSTS.has(host.toLowerCase())) return base;

  const devHost = getDevServerHost();
  return devHost ? `${scheme}${devHost}${port}${path}` : base;
}

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

export interface UpdateConfig {
  apiUrl: string;
  checkInterval: number; // ms
  enableApkUpdate: boolean;
  autoDownloadApk: boolean;
  showReleaseNotes: boolean;
}

// ============================================================================
// Default Config
// ============================================================================

const DEFAULT_CONFIG: UpdateConfig = {
  apiUrl: UPDATE_API_URL || 'https://api.yourdomain.com',
  checkInterval: parseInt(UPDATE_CHECK_INTERVAL || '14400000', 10),
  enableApkUpdate: ENABLE_APK_UPDATE !== 'false' && Boolean((UPDATE_API_URL || '').trim()),
  autoDownloadApk: AUTO_DOWNLOAD_APK !== 'false',
  showReleaseNotes: SHOW_RELEASE_NOTES !== 'false',
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

// ============================================================================
// Current App Version
// ============================================================================

async function getCurrentVersion(): Promise<{ versionName: string; versionCode: number }> {
  try {
    // Provided at bundle time from .env via react-native-dotenv
    const versionName = APP_VERSION_NAME || '1.0.0';
    const versionCode = APP_VERSION_CODE || 1;
    return { versionName, versionCode: parseInt(versionCode.toString(), 10) };
  } catch {
    // Fallback to package.json
    return { versionName: '1.0.4', versionCode: 5 };
  }
}

// ============================================================================
// APK Update Check
// ============================================================================

// Render's free tier spins the backend down after ~15 min idle; the first
// request then takes 30-50s for a cold start. A tight timeout would report the
// backend as "unreachable" and skip every update check until it warms up.
const UPDATE_REQUEST_TIMEOUT_MS = 45000;

/** `fetch` with a timeout so an unreachable backend can't hang the check. */
function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Request timed out after ${UPDATE_REQUEST_TIMEOUT_MS}ms`)),
      UPDATE_REQUEST_TIMEOUT_MS,
    );

    fetch(url, options).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function fetchLatestVersion(): Promise<UpdateInfo> {
  const { versionName, versionCode } = await getCurrentVersion();
  const apiBaseUrl = resolveApiBaseUrl(config.apiUrl);

  if (!apiBaseUrl.startsWith('http')) {
    return { hasUpdate: false, versionName, versionCode, downloadUrl: '' };
  }

  try {
    const response = await fetchWithTimeout(`${apiBaseUrl}/app/update/check`, {
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
    // An offline/unreachable update backend is expected during development, so
    // report it as a warning (not console.error, which surfaces a red LogBox).
    if (__DEV__) {
      console.warn(
        `[AutoUpdate] Update check skipped (${apiBaseUrl} unreachable):`,
        error instanceof Error ? error.message : error,
      );
    }
    return { hasUpdate: false, versionName, versionCode, downloadUrl: '' };
  }
}

// ============================================================================
// APK Download & Install
// ============================================================================

const APK_FILENAME = 'app-update.apk';
// Write into the app's *external* files dir. It is writable without any permission
// (scoped-storage safe), it is exposed by react-native-file-viewer's FileProvider
// (`<external-files-path>`), and it is easy to inspect with `adb shell` when debugging.
const APK_PATH = `${RNFS.ExternalDirectoryPath}/${APK_FILENAME}`;

/** Ask the server how large the APK should be (follows redirects, e.g. GitHub Releases). */
async function getRemoteSize(url: string): Promise<number> {
  try {
    const res = await fetchWithTimeout(url, { method: 'HEAD' });
    const len = Number(res.headers.get('content-length'));
    return Number.isFinite(len) && len > 0 ? len : 0;
  } catch {
    return 0;
  }
}

async function removeIfExists(path: string): Promise<void> {
  try {
    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }
  } catch {
    // ignore
  }
}

function downloadOnce(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const options = {
      fromUrl: url,
      toFile: APK_PATH,
      // `background: true` would hand off to Android's DownloadManager, which only writes
      // to public external storage. Keep it in-process so we can target our own dir.
      background: false,
    };

    RNFS.downloadFile(options)
      .promise.then((result: any) => {
        if (result.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Download failed with status ${result.statusCode}`));
        }
      })
      .catch(reject);
  });
}

const DOWNLOAD_ATTEMPTS = 3;

/**
 * Download the APK and verify it is complete before handing it to the installer.
 * RNFS can resolve "successfully" with a truncated file, which makes Android reject the
 * archive ("EOCD not found"), so we compare the on-disk size with the server's Content-Length
 * and retry when they differ.
 */
async function downloadApk(url: string): Promise<string> {
  const expectedSize = await getRemoteSize(url);
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    // Always start from a clean file so a partial previous attempt can't be mistaken for success.
    await removeIfExists(APK_PATH);

    try {
      await downloadOnce(url);

      const stat = await RNFS.stat(APK_PATH);
      const actualSize = Number(stat.size);

      if (!expectedSize || actualSize === expectedSize) {
        return APK_PATH;
      }

      lastError = new Error(
        `Incomplete download (attempt ${attempt}/${DOWNLOAD_ATTEMPTS}): ` +
          `${actualSize} of ${expectedSize} bytes`,
      );
      console.warn(`[AutoUpdate] ${lastError}`);
    } catch (error) {
      lastError = error;
      console.warn(`[AutoUpdate] Download attempt ${attempt}/${DOWNLOAD_ATTEMPTS} failed:`, error);
    }
  }

  await removeIfExists(APK_PATH);
  throw lastError instanceof Error ? lastError : new Error('Download failed');
}

export async function installApk(apkPath: string): Promise<void> {
  if (Platform.OS !== 'android') {
    throw new Error('APK install only supported on Android');
  }

  // react-native-file-viewer declares a FileProvider covering <external-files-path>,
  // which converts the file path into a content:// URI the package installer can read.
  await FileViewer.open(apkPath, {
    displayName: APK_FILENAME,
    showOpenWithDialog: false,
  });
}

// ============================================================================
// Main Update Check Function
// ============================================================================

export async function checkForUpdates(showAlert = true): Promise<{
  hasUpdate: boolean;
  type: 'apk' | 'none';
  info?: UpdateInfo;
}> {
  if (isChecking) return { hasUpdate: false, type: 'none' };
  isChecking = true;

  try {
    // Check APK updates (Android only)
    if (config.enableApkUpdate && Platform.OS === 'android') {
      const apkUpdate = await fetchLatestVersion();
      if (apkUpdate.hasUpdate && apkUpdate.downloadUrl) {
        if (config.autoDownloadApk) {
          await downloadAndPrepareApk(apkUpdate, showAlert);
        } else if (showAlert) {
          showUpdateAlert(
            'App Update Available',
            config.showReleaseNotes && apkUpdate.releaseNotes
              ? `Version ${apkUpdate.versionName} is available.\n\n${apkUpdate.releaseNotes}`
              : `Version ${apkUpdate.versionName} is available.`,
            () => downloadAndPrepareApk(apkUpdate, true),
            apkUpdate.mandatory
          );
        }
        return { hasUpdate: true, type: 'apk', info: apkUpdate };
      }
    }

    return { hasUpdate: false, type: 'none' };
  } catch (error) {
    console.warn('[AutoUpdate] Check failed:', error instanceof Error ? error.message : error);
    return { hasUpdate: false, type: 'none' };
  } finally {
    isChecking = false;
  }
}

async function downloadAndPrepareApk(info: UpdateInfo, showAlert = true) {
  try {
    await downloadApk(info.downloadUrl!);

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
              console.warn('[AutoUpdate] Install failed:', error);
              Alert.alert('Install Failed', 'Could not open installer. Please install manually from Downloads.');
            }
          },
        },
      ],
      { cancelable: !info.mandatory }
    );
  } catch (error) {
    console.warn('[AutoUpdate] Download failed:', error);
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

const timers: ReturnType<typeof setTimeout>[] = [];

export function startAutoUpdateCheck() {
  if (updateCheckTimer) return;

  // Initial check after app stabilizes. Keep the handle so stopAutoUpdateCheck
  // can cancel it too.
  const initialTimer = setTimeout(() => {
    checkForUpdates(false).catch((err) =>
      console.warn('[AutoUpdate] Initial check failed:', err instanceof Error ? err.message : err)
    );
  }, 5000);

  // Periodic checks
  updateCheckTimer = setInterval(() => {
    checkForUpdates(false).catch((err) =>
      console.warn('[AutoUpdate] Periodic check failed:', err instanceof Error ? err.message : err)
    );
  }, config.checkInterval);

  // Store both handles in one place so the stop function clears everything.
  timers.push(initialTimer);
}

export function stopAutoUpdateCheck() {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer);
    updateCheckTimer = null;
  }
  while (timers.length > 0) {
    const t = timers.pop();
    if (t) clearTimeout(t);
  }
}