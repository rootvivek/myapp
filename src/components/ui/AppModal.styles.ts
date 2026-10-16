import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { radius, sizes, spacing } from '../../theme';

export const modalSizeConfig = {
  small: { maxWidth: 320, width: '90%' as const },
  medium: { maxWidth: 400, width: '90%' as const },
  large: { maxWidth: 500, width: '95%' as const },
  full: { maxWidth: '100%' as const, width: '100%' as const },
};

export function createAppModalStyles(colors: AppColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    fullOverlay: {
      paddingHorizontal: 0,
    },
    sheetOuter: {
      alignSelf: 'center',
    },
    fullSheetOuter: {
      flex: 1,
      width: '100%',
    },
    sheet: {
      borderRadius: radius.xl,
      borderWidth: sizes.hairline,
      overflow: 'hidden',
      borderColor: colors.border,
      backgroundColor: colors.surface,
      shadowColor: colors.bg,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 8,
    },
    fullSheet: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xs,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.text,
    },
    emptyHeader: {
      flex: 1,
    },
    subtitle: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      fontSize: 14,
      lineHeight: 19,
      color: colors.textMuted,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    fullContent: {
      flex: 1,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: sizes.hairline,
      borderTopColor: colors.border,
    },
  });
}

export type AppModalStyles = ReturnType<typeof createAppModalStyles>;