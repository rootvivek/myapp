import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type AuthStorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

/** Supabase Auth session storage using AsyncStorage (replaces expo-file-system). */
function nativeStorage(): AuthStorageAdapter {
  return {
    getItem: async (key: string) => {
      return AsyncStorage.getItem(key);
    },
    setItem: async (key: string, value: string) => {
      await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
      await AsyncStorage.removeItem(key);
    },
  };
}

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

export function getSupabaseAuthStorage(): AuthStorageAdapter {
  if (Platform.OS === 'web') return webStorage();
  return nativeStorage();
}
