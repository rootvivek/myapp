import { StyleSheet, type TextStyle } from 'react-native';

import type { AppColors } from '../../theme';
import { radius, sizes, spacing } from '../../theme';

export function appFieldLabelStyle(colors: AppColors): TextStyle {
  return {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    color: colors.text,
    marginBottom: sizes.labelGap,
  };
}

export type AppInputStyleOptions = {
  borderColor: string;
  editable: boolean;
  dense: boolean;
  multiline?: boolean;
  trailingReserve: number;
};

export function createAppInputStyles(colors: AppColors, options: AppInputStyleOptions) {
  return StyleSheet.create({
    group: {
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: options.editable ? colors.surface2 : colors.surface,
      borderRadius: radius.lg,
      height: options.dense ? sizes.inputHeightDense : options.multiline ? undefined : sizes.inputHeight,
      minHeight: options.multiline ? 96 : undefined,
      fontSize: 15,
      paddingRight: options.trailingReserve ? options.trailingReserve : undefined,
    },
    multiline: {
      paddingTop: spacing.sm,
    },
    trailingRow: {
      position: 'absolute',
      right: spacing.xs,
      top: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    trailingAction: {
      minHeight: 32,
      borderRadius: radius.sm,
    },
    trailingActionLabel: {
      fontSize: 13,
      fontWeight: '600',
    },
    errorText: {
      fontSize: 12,
      marginTop: 2,
      marginLeft: 2,
    },
  });
}

/** Paper's theme is kept beside the input styles so all input colours have one owner. */
export function createAppInputTheme(
  colors: AppColors,
  options: Pick<AppInputStyleOptions, 'borderColor' | 'editable'>,
) {
  return {
    roundness: radius.md,
    colors: {
      primary: colors.accent,
      background: options.editable ? colors.surface2 : colors.surface,
      placeholder: colors.textMuted,
      text: colors.text,
      error: colors.danger,
      outline: options.borderColor,
    },
  };
}

export type AppInputStyles = ReturnType<typeof createAppInputStyles>;