import { StyleSheet } from 'react-native';

import type { AppColors } from '../../../theme';
import { radius, spacing } from '../../../theme';

export function createKhataHomeScreenStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    search: {
      marginBottom: 12,
    },
    sharedButton: {
      marginBottom: 12,
    },
    error: {
      color: colors.danger,
      fontSize: 13,
      marginBottom: 10,
    },
    refreshed: {
      color: colors.textMuted,
      fontSize: 12,
      marginBottom: spacing.sm,
    },
    filters: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: 12,
      backgroundColor: colors.surface2,
      padding: 4,
      borderRadius: radius.md,
    },
    filter: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: radius.sm + 2,
      alignItems: 'center',
    },
    filterActive: {
      backgroundColor: colors.accent,
    },
    filterText: {
      color: colors.textMuted,
      fontWeight: '500',
      fontSize: 13,
    },
    filterTextActive: {
      color: colors.onAccent,
      fontWeight: '700',
    },
    loading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      color: colors.textMuted,
    },
    list: {
      paddingBottom: 100,
    },
  });
}

export function createKhataFormScreenStyles(colors: AppColors, bottomPadding: number) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      padding: spacing.md,
      paddingBottom: bottomPadding,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginTop: 20,
      marginBottom: 24,
    },
    field: {
      marginBottom: spacing.md,
    },
    categoryLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    categoryButton: {
      marginBottom: 6,
    },
    categoryGap: {
      gap: spacing.sm,
    },
    error: {
      color: colors.danger,
      marginTop: 12,
      marginBottom: 12,
    },
  });
}

export function createAddTransactionScreenStyles(colors: AppColors, bottomInset: number) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      padding: spacing.md,
      paddingBottom: 24,
    },
    title: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginTop: 20,
      marginBottom: 24,
    },
    partyLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    partyCard: {
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      marginBottom: 20,
    },
    partyName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    field: {
      marginBottom: spacing.md,
    },
    noteField: {
      marginBottom: 20,
    },
    actions: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: spacing.md,
      paddingTop: 10,
      paddingBottom: bottomInset + 10,
      backgroundColor: colors.bg,
    },
    action: {
      flex: 1,
    },
  });
}