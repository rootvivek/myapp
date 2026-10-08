import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import { accentAlpha, colorsForMode, radius, type AppColors } from '../theme';

/**
 * The single source of truth for React Native Paper.
 *
 * Every Paper primitive (Button, TextInput, Card, Modal, Menu, ...) reads its
 * colours, typography and default roundness from here, so screens should not
 * restate them. Layout-specific values (input height, radii, spacing) live in
 * `src/theme.ts` and are applied by the thin wrappers in `src/components/ui`.
 */
export function createPaperTheme(mode: 'light' | 'dark'): MD3Theme {
  const colors: AppColors = colorsForMode(mode);
  const isDark = mode === 'dark';
  const base = isDark ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    version: 3,
    dark: isDark,
    // One radius system: inputs + buttons = 12px (see `radius.md`).
    roundness: radius.md,
    animation: base.animation,
    colors: {
      ...base.colors,
      // Primary / accent
      primary: colors.accent,
      onPrimary: '#FFFFFF',
      primaryContainer: accentAlpha(colors.accent, 0.12),
      onPrimaryContainer: colors.accent,
      // Secondary
      secondary: colors.accent,
      onSecondary: '#FFFFFF',
      secondaryContainer: accentAlpha(colors.accent, 0.10),
      onSecondaryContainer: colors.accent,
      // Tertiary = success
      tertiary: colors.success,
      onTertiary: '#FFFFFF',
      tertiaryContainer: accentAlpha(colors.success, 0.12),
      onTertiaryContainer: colors.success,
      // Error
      error: colors.danger,
      onError: '#FFFFFF',
      errorContainer: accentAlpha(colors.danger, 0.12),
      onErrorContainer: colors.danger,
      // Surfaces
      background: colors.bg,
      onBackground: colors.text,
      surface: colors.surface,
      onSurface: colors.text,
      surfaceVariant: colors.surface2,
      onSurfaceVariant: colors.textMuted,
      surfaceDisabled: colors.surfaceDisabled,
      onSurfaceDisabled: colors.onSurfaceDisabled,
      // Outline
      outline: colors.border,
      outlineVariant: colors.border,
      // Inverse (snackbars, tooltips)
      inverseSurface: isDark ? '#F5F5F7' : '#111114',
      inverseOnSurface: isDark ? '#111114' : '#F5F5F7',
      inversePrimary: colors.accent,
    },
    fonts: base.fonts,
  };
}
