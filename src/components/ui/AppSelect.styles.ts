import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { radius, sizes, spacing } from '../../theme';

export function createAppSelectStyles(
  colors: AppColors,
  options: { borderColor: string; backgroundColor: string; disabled: boolean }
) {
  return StyleSheet.create({
    container: {
      marginBottom: spacing.sm,
    },
    trigger: {
      height: sizes.inputHeight,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      justifyContent: 'center',
      backgroundColor: options.backgroundColor,
      borderColor: options.borderColor,
      opacity: options.disabled ? 0.7 : 1,
    },
    triggerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    triggerText: {
      flex: 1,
      fontSize: 15,
      fontWeight: '400',
    },
    selectedTriggerText: {
      color: colors.text,
    },
    placeholderText: {
      color: colors.textMuted,
    },
    menu: {
      maxHeight: 260,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    menuAnchor: {
      marginTop: spacing.xs,
    },
    searchWrap: {
      padding: spacing.sm,
      borderBottomWidth: sizes.hairline,
      borderBottomColor: colors.border,
    },
    searchInput: {
      fontSize: 14,
    },
    itemText: {
      fontSize: 15,
    },
    selectedItemText: {
      color: colors.accent,
      fontWeight: '600',
    },
    itemTextDisabled: {
      opacity: 0.5,
    },
    emptyText: {
      padding: spacing.md,
      textAlign: 'center',
      fontSize: 14,
      color: colors.textMuted,
    },
    errorText: {
      fontSize: 12,
      marginTop: 2,
      marginLeft: 2,
    },
  });
}

export type AppSelectStyles = ReturnType<typeof createAppSelectStyles>;