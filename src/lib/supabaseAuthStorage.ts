import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_FILE = 'supabase_auth_kv.json';

type AuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/** Supabase Auth session storage without @react-native-async-storage (avoids native module null on some Expo builds). */
function webStorage(): AuthStorageAdapter {
  return {
    getItem: (key: string) =>
      Promise.resolve(typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null),
    setItem: (key: string, value: string) => {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
      return Promise.resolve();
    },
  };
}

async function readAll(): Promise<Record<string, string>> {
  const root = FileSystem.documentDirectory;
  if (!root) return {};
  const path = `${root}${STORAGE_FILE}`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return {};
  try {
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

async function writeAll(data: Record<string, string>): Promise<void> {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('Document directory unavailable');
  await FileSystem.writeAsStringAsync(`${root}${STORAGE_FILE}`, JSON.stringify(data));
}

function nativeFileStorage(): AuthStorageAdapter {
  return {
    getItem: async (key: string) => {
      const all = await readAll();
      return all[key] ?? null;
    },
    setItem: async (key: string, value: string) => {
      const all = await readAll();
      all[key] = value;
      await writeAll(all);
    },
    removeItem: async (key: string) => {
      const all = await readAll();
      delete all[key];
      await writeAll(all);
    },
  };
}

export function getSupabaseAuthStorage(): AuthStorageAdapter {
  if (Platform.OS === 'web') return webStorage();
  return nativeFileStorage();
}
