import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';

export function createBottomNavBarStyles(colors: AppColors, bottomInset: number) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderTopWidth: sizes.hairline,
      paddingTop: 2,
      paddingBottom: Math.max(bottomInset, 10),
      shadowColor: colors.bg,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    tabBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      gap: 0,
    },
    centerButtonContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -16,
    },
    centerFab: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      justifyContent: 'center',
      alignItems: 'center',
    },
    fabIconWrapper: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerLabel: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '600',
      marginTop: 1,
    },
    tabLabel: {
      fontSize: 11,
      fontWeight: '600',
      marginTop: 0,
    },
    tabLabelActive: {
      color: colors.accent,
    },
    tabLabelInactive: {
      color: colors.textMuted,
    },
  });
}

export type BottomNavBarStyles = ReturnType<typeof createBottomNavBarStyles>;