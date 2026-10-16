import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { radius } from '../../theme';

export function createAppIconButtonStyles(colors: AppColors, size: number) {
  return StyleSheet.create({
    button: {
      width: size,
      height: size,
      borderRadius: radius.full,
    },
    primary: {
      backgroundColor: colors.accent,
    },
    secondary: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tertiary: {
      backgroundColor: 'transparent',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: colors.danger,
    },
    disabled: {
      backgroundColor: colors.surfaceDisabled,
    },
  });
}

export function getAppIconButtonPreset(colors: AppColors, variant: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger') {
  if (variant === 'primary') return { iconColor: colors.onAccent };
  if (variant === 'danger') return { iconColor: colors.onDanger };
  if (variant === 'secondary') return { iconColor: colors.text };
  if (variant === 'ghost') return { iconColor: colors.textMuted };
  return { iconColor: colors.accent };
}

export type AppIconButtonStyles = ReturnType<typeof createAppIconButtonStyles>;