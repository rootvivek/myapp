/** Shared layout tokens (not mode-dependent). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
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
  bg: '#0f1419',
  surface: '#1a222d',
  surface2: '#232d3b',
  border: '#2d3a4a',
  text: '#e8eef4',
  textMuted: '#8b9aaf',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#eab308',
  danger: '#ef4444',
  chipBg: '#2a3544',
};

export const lightColors: AppColors = {
  bg: '#f1f5f9',
  surface: '#ffffff',
  surface2: '#f8fafc',
  border: '#e2e8f0',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#2563eb',
  success: '#16a34a',
  warning: '#ca8a04',
  danger: '#dc2626',
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
