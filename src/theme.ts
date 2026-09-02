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

/** Premium dark UI (Linear / Raycast / Vercel inspired deep obsidian palette). */
export const darkColors: AppColors = {
  bg: '#08090E',
  bgGradient: ['#0B0D14', '#111422', '#08090E'],
  surface: '#121520',
  surface2: '#181C2B',
  border: '#23283E',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  accent: '#8B5CF6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  chipBg: '#181C2B',

  // Status badges in dark mode
  statusPendingText: '#FBBF24',
  statusPendingBg: 'rgba(245, 158, 11, 0.16)',
  statusPendingBorder: 'rgba(245, 158, 11, 0.32)',
  
  statusInProgressText: '#818CF8',
  statusInProgressBg: 'rgba(129, 140, 248, 0.16)',
  statusInProgressBorder: 'rgba(129, 140, 248, 0.32)',

  statusCompletedText: '#38BDF8',
  statusCompletedBg: 'rgba(56, 189, 248, 0.16)',
  statusCompletedBorder: 'rgba(56, 189, 248, 0.32)',

  statusDeliveredText: '#34D399',
  statusDeliveredBg: 'rgba(52, 211, 153, 0.16)',
  statusDeliveredBorder: 'rgba(52, 211, 153, 0.32)',

  statusCancelledText: '#FB7185',
  statusCancelledBg: 'rgba(251, 113, 133, 0.16)',
  statusCancelledBorder: 'rgba(251, 113, 133, 0.32)',
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
