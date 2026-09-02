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

export type AppColors = {
  bg: string;
  bgGradient: string[];
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

  // Dynamic Status Badge Colors
  statusPendingText: string;
  statusPendingBg: string;
  statusPendingBorder: string;
  
  statusInProgressText: string;
  statusInProgressBg: string;
  statusInProgressBorder: string;

  statusCompletedText: string;
  statusCompletedBg: string;
  statusCompletedBorder: string;

  statusDeliveredText: string;
  statusDeliveredBg: string;
  statusDeliveredBorder: string;

  statusCancelledText: string;
  statusCancelledBg: string;
  statusCancelledBorder: string;
};

/** Premium dark UI (CRED / Linear inspired). */
export const darkColors: AppColors = {
  bg: '#050816',
  bgGradient: ['#020617', '#03122D', '#020617'],
  surface: '#0F172A',
  surface2: '#1A2332',
  border: '#1E293B',
  text: '#FFFFFF',
  textMuted: '#94A3B8',
  accent: '#7C3AED',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  chipBg: '#1E293B',

  // Status badges in dark mode
  statusPendingText: '#F59E0B',
  statusPendingBg: 'rgba(245, 158, 11, 0.15)',
  statusPendingBorder: 'rgba(245, 158, 11, 0.3)',
  
  statusInProgressText: '#818CF8',
  statusInProgressBg: 'rgba(99, 102, 241, 0.15)',
  statusInProgressBorder: 'rgba(99, 102, 241, 0.3)',

  statusCompletedText: '#60A5FA',
  statusCompletedBg: 'rgba(59, 130, 246, 0.15)',
  statusCompletedBorder: 'rgba(59, 130, 246, 0.3)',

  statusDeliveredText: '#22C55E',
  statusDeliveredBg: 'rgba(34, 197, 94, 0.15)',
  statusDeliveredBorder: 'rgba(34, 197, 94, 0.3)',

  statusCancelledText: '#EF4444',
  statusCancelledBg: 'rgba(239, 68, 68, 0.15)',
  statusCancelledBorder: 'rgba(239, 68, 68, 0.3)',
};

export const lightColors: AppColors = {
  bg: '#F8FAFC',
  bgGradient: ['#F8FAFC', '#E0F2FE', '#F3E8FF'], // Crisp slate white, soft sky blue, soft lavender
  surface: 'rgba(255, 255, 255, 0.70)',        // Frosted glass
  surface2: 'rgba(255, 255, 255, 0.40)',       // Transparent sub-card
  border: 'rgba(124, 58, 237, 0.12)',          // Soft violet/slate border for glassmorphism alignment
  text: '#0F172A',                             // High contrast slate
  textMuted: '#475569',
  accent: '#7C3AED',                           // Neon violet (matches dark mode accent)
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  chipBg: 'rgba(255, 255, 255, 0.45)',          // Translucent chips

  // Status badges in light mode (high contrast premium variants)
  statusPendingText: '#B45309',
  statusPendingBg: 'rgba(217, 119, 6, 0.12)',
  statusPendingBorder: 'rgba(217, 119, 6, 0.24)',
  
  statusInProgressText: '#4F46E5',
  statusInProgressBg: 'rgba(79, 70, 229, 0.12)',
  statusInProgressBorder: 'rgba(79, 70, 229, 0.24)',

  statusCompletedText: '#1D4ED8',
  statusCompletedBg: 'rgba(37, 99, 235, 0.12)',
  statusCompletedBorder: 'rgba(37, 99, 235, 0.24)',

  statusDeliveredText: '#047857',
  statusDeliveredBg: 'rgba(22, 163, 74, 0.12)',
  statusDeliveredBorder: 'rgba(22, 163, 74, 0.24)',

  statusCancelledText: '#B91C1C',
  statusCancelledBg: 'rgba(220, 38, 38, 0.12)',
  statusCancelledBorder: 'rgba(220, 38, 38, 0.24)',
};

export function colorsForMode(mode: 'light' | 'dark'): AppColors {
  return mode === 'light' ? lightColors : darkColors;
}

/** Soft overlay using the accent hex (chips, tinted buttons). */
export function accentAlpha(accentHex: string, alpha: number): string {
  const hex = accentHex.replace('#', '').slice(0, 6);
  if (hex.length !== 6) return `rgba(234, 88, 12, ${alpha})`;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
