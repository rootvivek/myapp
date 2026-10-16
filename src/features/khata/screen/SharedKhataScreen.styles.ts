import { StyleSheet } from 'react-native';

import type { AppColors } from '../../../theme';
import { radius, spacing } from '../../../theme';

export function createSharedKhataScreenStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
      padding: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: 6,
    },
    description: {
      color: colors.textMuted,
      marginBottom: 12,
    },
    verifyCard: {
      padding: 12,
      marginBottom: 12,
      borderRadius: radius.md,
      backgroundColor: colors.surface2,
    },
    verifyTitle: {
      color: colors.text,
      fontWeight: '800',
      marginBottom: 6,
    },
    verifyDescription: {
      color: colors.textMuted,
      marginBottom: spacing.sm,
    },
    section: {
      marginBottom: 12,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: spacing.sm,
    },
    requestCard: {
      padding: 12,
      marginBottom: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface2,
    },
    requestShop: {
      color: colors.text,
      fontWeight: '700',
    },
    requestDescription: {
      color: colors.textMuted,
      marginTop: 2,
    },
    requestActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: 10,
    },
    action: {
      flex: 1,
    },
    message: {
      color: colors.success,
      marginBottom: spacing.sm,
    },
    error: {
      color: colors.danger,
      marginBottom: spacing.sm,
    },
    ledgerCard: {
      padding: 14,
      marginBottom: 10,
      borderRadius: radius.md,
      backgroundColor: colors.surface2,
    },
    ledgerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    ledgerParty: {
      color: colors.text,
      fontWeight: '800',
      fontSize: 16,
      flex: 1,
    },
    ledgerBalance: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    ledgerMeta: {
      color: colors.textMuted,
      marginTop: 3,
    },
    transaction: {
      paddingVertical: 9,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 8,
    },
    transactionType: {
      color: colors.text,
      fontWeight: '600',
    },
    transactionMeta: {
      color: colors.textMuted,
    },
    list: {
      paddingBottom: 20,
    },
  });
}