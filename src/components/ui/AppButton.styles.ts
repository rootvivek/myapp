import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { accentAlpha, radius, sizes } from '../../theme';

import type { ButtonVariant } from './AppButton';

export function createAppButtonStyles(colors: AppColors) {
  return StyleSheet.create({
    button: {
      minHeight: sizes.buttonHeight,
      borderRadius: radius.md,
      paddingHorizontal: sizes.controlPadding,
    },
    outline: {
      borderWidth: 1,
      borderColor: accentAlpha(colors.accent, 0.4),
    },
    secondary: {
      borderWidth: 1,
      borderColor: colors.border,
    },
    fullWidth: {
      width: '100%',
    },
    label: {
      fontSize: 15,
      fontWeight: '600',
      letterSpacing: -0.15,
    },
    content: {
      minHeight: sizes.buttonHeight - 2,
    },
  });
}

export function getAppButtonPreset(colors: AppColors, variant: ButtonVariant) {
  if (variant === 'primary') {
    return { mode: 'contained' as const, buttonColor: colors.accent, textColor: colors.onAccent };
  }
  if (variant === 'secondary') {
    return { mode: 'contained' as const, buttonColor: colors.surface2, textColor: colors.text };
  }
  if (variant === 'danger') {
    return { mode: 'contained' as const, buttonColor: colors.danger, textColor: colors.onDanger };
  }
  if (variant === 'outline') {
    return { mode: 'outlined' as const, buttonColor: undefined, textColor: colors.accent };
  }
  return { mode: 'text' as const, buttonColor: undefined, textColor: colors.accent };
}

export type AppButtonStyles = ReturnType<typeof createAppButtonStyles>;