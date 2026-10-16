import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { radius, sizes } from '../../theme';

export function createAppChipStyles(colors: AppColors, dense: boolean) {
  return StyleSheet.create({
    chip: {
      borderRadius: radius.sm,
      minHeight: dense ? 18 : 22,
    },
    default: {
      backgroundColor: colors.chipBg,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    success: {
      backgroundColor: colors.success,
      borderWidth: 0,
    },
    warning: {
      backgroundColor: colors.warning,
      borderWidth: 0,
    },
    danger: {
      backgroundColor: colors.danger,
      borderWidth: 0,
    },
    accent: {
      backgroundColor: colors.accent,
      borderWidth: 0,
    },
    disabled: {
      backgroundColor: colors.surfaceDisabled,
    },
    defaultLabel: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '500',
    },
    filledLabel: {
      color: colors.onAccent,
      fontSize: 11,
      fontWeight: '600',
    },
    dangerLabel: {
      color: colors.onDanger,
    },
  });
}

export function getAppChipVariantStyles(
  styles: ReturnType<typeof createAppChipStyles>,
  variant: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary',
  disabled: boolean,
) {
  const variantStyle =
    variant === 'success'
      ? styles.success
      : variant === 'warning'
        ? styles.warning
        : variant === 'danger'
          ? styles.danger
          : variant === 'info' || variant === 'primary'
            ? styles.accent
            : styles.default;

  return [variantStyle, disabled && styles.disabled];
}

export type AppChipStyles = ReturnType<typeof createAppChipStyles>;