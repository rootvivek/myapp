/** Shared layout tokens (not mode-dependent). */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  /** Screen-level left/right gutter — applied on every screen (tabs + stack screens). */
  gutter: 4,
};

/** One corner-radius system for the whole app. */
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

/** One control-size system so every input / button lines up. */
export const sizes = {
  inputHeight: 44,
  inputHeightDense: 36,
  buttonHeight: 48,
  buttonHeightCompact: 36,
  iconButton: 40,
  /** Horizontal padding applied inside inputs and buttons. */
  controlPadding: 16,
  labelGap: 6,
  /** Border width used by inputs, cards and outlined controls. */
  hairline: 1,
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
  /** Disabled control fill (inputs, buttons, cards). */
  surfaceDisabled: string;
  /** Content drawn on top of a disabled control. */
  onSurfaceDisabled: string;

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

/** Flat, iOS-inspired dark palette (neutral greys, no glass, no gradients). */
export const darkColors: AppColors = {
  bg: '#0A0A0C',
  surface: '#141416',
  surface2: '#1C1C1E',
  border: '#2A2A2E',
  text: '#F5F5F7',
  textMuted: '#98989E',
  accent: '#0A84FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#FF453A',
  chipBg: '#1C1C1E',
  surfaceDisabled: 'rgba(255, 255, 255, 0.08)',
  onSurfaceDisabled: 'rgba(255, 255, 255, 0.30)',

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

/** Flat, iOS-inspired light palette (solid fills, hairline borders, no glass). */
export const lightColors: AppColors = {
  bg: '#F2F2F7',
  surface: '#FFFFFF',                             // cards, sheets, modals
  surface2: '#F2F2F7',                            // inputs, tonal fills, secondary buttons
  border: '#E3E3E8',                              // hairline separators
  text: '#111114',                                // high contrast label
  textMuted: '#6B6B76',
  accent: '#007AFF',                              // iOS system blue
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  chipBg: '#F2F2F7',
  surfaceDisabled: 'rgba(0, 0, 0, 0.06)',
  onSurfaceDisabled: 'rgba(0, 0, 0, 0.32)',

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
