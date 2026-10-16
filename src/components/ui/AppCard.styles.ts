import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { radius, sizes } from '../../theme';

export function createAppCardStyles(colors: AppColors, padding: number) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      padding,
    },
    filled: {
      backgroundColor: colors.surface2,
    },
    outlined: {
      borderWidth: sizes.hairline,
    },
    noBorder: {
      borderWidth: 0,
    },
  });
}

export type AppCardStyles = ReturnType<typeof createAppCardStyles>;