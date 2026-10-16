import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';

export function createHomeHeaderStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderBottomWidth: sizes.hairline,
      borderBottomColor: colors.border,
      paddingBottom: spacing.xs,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.xs,
    },
    searchBar: {
      flex: 1,
      height: 44,
      borderRadius: radius.lg,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      gap: 10,
    },
    searchPlaceholder: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
    filterSection: {
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.gutter,
    },
    filterScroll: {
      gap: spacing.xs,
    },
    filterChip: {
      paddingHorizontal: 2,
    },
    activeFilterChip: {
      backgroundColor: colors.surface2,
      borderColor: colors.text,
    },
    filterLabel: {
      fontSize: 11,
      fontWeight: '600',
    },
    activeFilterLabel: {
      color: colors.text,
      fontWeight: '700',
    },
    inactiveFilterLabel: {
      color: colors.textMuted,
    },
  });
}

export type HomeHeaderStyles = ReturnType<typeof createHomeHeaderStyles>;