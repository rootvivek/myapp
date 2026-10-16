import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';

const GRID_SIZE = 300;

export function createPatternDrawingModalStyles(colors: AppColors, overlayColor: string, screenWidth: number) {
  return StyleSheet.create({
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: overlayColor,
    },
    modalContent: {
      width: Math.min(screenWidth - 36, 400),
      borderRadius: radius.xl + 4,
      borderWidth: sizes.hairline,
      padding: spacing.lg + 4,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    header: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    titleIcon: {
      marginRight: spacing.sm,
    },
    titleText: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
    closeBtn: {
      padding: spacing.xs,
    },
    hintText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    gridContainer: {
      width: GRID_SIZE,
      height: GRID_SIZE,
      borderRadius: radius.xl,
      overflow: 'hidden',
      borderWidth: sizes.hairline,
      marginBottom: spacing.lg,
      backgroundColor: colors.surface2,
      borderColor: colors.border,
    },
    svgOverlay: {
      width: '100%',
      height: '100%',
    },
    actionRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm + 4,
    },
    actionBtn: {
      flex: 1,
      height: sizes.buttonHeight,
      borderRadius: radius.md + 2,
      borderWidth: sizes.hairline,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderColor: colors.border,
    },
    actionIcon: {
      marginRight: spacing.xs + 2,
    },
    actionBtnText: {
      color: colors.textMuted,
      fontSize: 14,
      fontWeight: '700',
    },
    saveBtn: {
      flex: 1.3,
      height: sizes.buttonHeight,
      borderRadius: radius.md + 2,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.accent,
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      color: colors.onAccent,
      fontSize: 14,
      fontWeight: '800',
    },
  });
}