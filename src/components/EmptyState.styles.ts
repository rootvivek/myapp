import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { spacing } from '../theme';

export function createEmptyStateStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    iconWrapper: {
      marginBottom: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    description: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
  });
}