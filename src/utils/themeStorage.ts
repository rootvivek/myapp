import * as FileSystem from 'expo-file-system/legacy';

const FILE = 'app_theme.json';

export type ThemePreference = 'light' | 'dark';

export async function getThemePreference(): Promise<ThemePreference> {
  const root = FileSystem.documentDirectory;
  if (!root) return 'dark';
  const path = `${root}${FILE}`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return 'dark';
  try {
    const raw = await FileSystem.readAsStringAsync(path);
    const parsed = JSON.parse(raw) as { mode?: string };
    return parsed.mode === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export async function saveThemePreference(mode: ThemePreference): Promise<void> {
  const root = FileSystem.documentDirectory;
  if (!root) throw new Error('Document directory unavailable');
  await FileSystem.writeAsStringAsync(`${root}${FILE}`, JSON.stringify({ mode }));
}
