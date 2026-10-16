import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { accentAlpha } from '../theme';

export function createAccessoryRowStyles(colors: AppColors, value: boolean) {
  const tint = value ? colors.success : colors.danger;

  return StyleSheet.create({
    badge: {
      backgroundColor: accentAlpha(tint, 0.12),
    },
    badgeText: {
      color: tint,
    },
  });
}