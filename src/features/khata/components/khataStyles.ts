import { StyleSheet } from 'react-native';

import type { AppColors } from '../../../theme';
import { radius, spacing } from '../../../theme';

export function createKhataEmptyStateStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    iconWrapper: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    description: {
      color: colors.textMuted,
      fontSize: 13,
      maxWidth: 260,
      textAlign: 'center',
    },
    action: {
      marginTop: spacing.md,
    },
  });
}

export function createKhataFloatingButtonStyles(colors: AppColors) {
  return StyleSheet.create({
    button: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.bg,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    iconWrapper: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.onAccent,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

export function createKhataPartyRowStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    avatarText: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
    },
    body: {
      flex: 1,
      minWidth: 0,
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    phone: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 4,
    },
    metadata: {
      fontSize: 11,
      color: colors.textMuted,
    },
    balance: {
      alignItems: 'flex-end',
      minWidth: 80,
    },
    balanceValue: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      lineHeight: 20,
    },
    balanceLabel: {
      fontSize: 10,
      color: colors.textMuted,
      textTransform: 'uppercase',
    },
  });
}

export function createKhataTransactionBubbleStyles(colors: AppColors, isLeft: boolean, isGiven: boolean) {
  const textColor = isGiven ? colors.text : colors.onAccent;
  return StyleSheet.create({
    row: {
      width: '100%',
      alignItems: isLeft ? 'flex-start' : 'flex-end',
      marginBottom: 10,
    },
    bubble: {
      maxWidth: '82%',
      minWidth: 110,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 18,
      backgroundColor: isGiven ? colors.surface2 : colors.accent,
    },
    amount: {
      color: textColor,
      fontSize: 16,
      fontWeight: '800',
    },
    note: {
      color: textColor,
      fontSize: 13,
      marginTop: 3,
    },
  });
}

export function createKhataPartyDetailStyles(colors: AppColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    header: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface2,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent,
    },
    partyInfo: {
      flex: 1,
    },
    partyName: {
      fontSize: 17,
      fontWeight: '800',
      color: colors.text,
    },
    partyType: {
      fontSize: 13,
      color: colors.textMuted,
    },
    balance: {
      alignItems: 'flex-end',
      flexShrink: 0,
    },
    balanceLabel: {
      fontSize: 11,
      color: colors.textMuted,
    },
    balanceValue: {
      fontSize: 20,
      fontWeight: '900',
      color: colors.text,
    },
    balanceDirection: {
      fontSize: 10,
      color: colors.textMuted,
    },
    history: {
      flex: 1,
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
      padding: 16,
      paddingBottom: 24,
      flexGrow: 1,
    },
    footer: {
      padding: 12,
      backgroundColor: colors.surface2,
    },
  });
}