import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { colorsForMode, type AppColors } from '../theme';
import { getThemePreference, saveThemePreference, type ThemePreference } from '../utils/themeStorage';

type ThemeContextValue = {
  colors: AppColors;
  mode: ThemePreference;
  setMode: (mode: ThemePreference) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemePreference>('dark');

  useEffect(() => {
    let cancelled = false;
    void getThemePreference().then((m) => {
      if (!cancelled) setModeState(m);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback(async (next: ThemePreference) => {
    setModeState(next);
    await saveThemePreference(next);
  }, []);

  const colors = useMemo(() => colorsForMode(mode), [mode]);

  const value = useMemo(
    () => ({
      colors,
      mode,
      setMode,
    }),
    [colors, mode, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
