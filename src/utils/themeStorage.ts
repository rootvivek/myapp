import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = '@myapp_theme_mode';

export async function loadThemeMode(): Promise<'light' | 'dark' | null> {
  try {
    const value = await AsyncStorage.getItem(THEME_STORAGE_KEY);
    if (value === 'light' || value === 'dark') return value;
    return null;
  } catch {
    return null;
  }
}

export async function saveThemeMode(mode: 'light' | 'dark'): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}
