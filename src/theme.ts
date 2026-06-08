/** Shared layout tokens (not mode-dependent). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const elevation = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export type AppColors = {
  bg: string;
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  chipBg: string;
};

/** Default app look (existing dark UI). */
export const darkColors: AppColors = {
  bg: '#0f172a',
  surface: '#1e293b',
  surface2: '#334155',
  border: '#475569',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  accent: '#818cf8',
  success: '#34d399',
  warning: '#fbbf24',
  danger: '#f87171',
  chipBg: '#334155',
};

export const lightColors: AppColors = {
  bg: '#f1f5f9',
  surface: '#ffffff',
  surface2: '#e2e8f0',
  border: '#cbd5e1',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  chipBg: '#e2e8f0',
};

export function colorsForMode(mode: 'light' | 'dark'): AppColors {
  return mode === 'light' ? lightColors : darkColors;
}

/** Soft overlay using the accent hex (chips, tinted buttons). */
export function accentAlpha(accentHex: string, alpha: number): string {
  const hex = accentHex.replace('#', '');
  if (hex.length !== 6) return `rgba(59, 130, 246, ${alpha})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
