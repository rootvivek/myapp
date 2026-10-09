import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { radius, sizes, spacing } from '../../theme';

export function createAddRepairStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    content: {
      paddingHorizontal: spacing.gutter,
      paddingTop: 6,
      paddingBottom: 110,
      gap: 12,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* Order Banner (Edit mode) */
    orderBanner: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    orderBannerLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    orderBannerValue: {
      color: colors.accent,
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.2,
    },

    /* Section headings above non-input controls (chips, switches, previews) */
    fieldLabel: {
      color: colors.text,
      fontSize: 12.5,
      fontWeight: '600',
      marginBottom: sizes.labelGap,
    },
    inputTight: {
      marginBottom: 4,
    },
    inputFlex: {
      flex: 1,
      minWidth: 0,
    },

    /* Inline suggestion lists (customer search & device brand search) */
    suggestionsContainer: {
      backgroundColor: colors.surface,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      borderRadius: radius.md,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    suggestionItem: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    suggestionName: {
      color: colors.text,
      fontWeight: '600',
      fontSize: 13.5,
    },
    suggestionPhone: {
      color: colors.textMuted,
      fontSize: 11.5,
    },
    brandSuggestContainer: {
      backgroundColor: colors.surface,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      borderRadius: radius.md,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      overflow: 'hidden',
      maxHeight: 180,
    },

    /* Billing & Payment */
    billingRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    balancePreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginTop: 2,
    },
    balanceLabel: {
      color: colors.textMuted,
      fontSize: 12.5,
      fontWeight: '500',
    },
    balanceValue: {
      fontSize: 14,
      fontWeight: '700',
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      marginTop: 4,
    },
    switchLabel: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '500',
    },
  });
}

export type AddRepairStyles = ReturnType<typeof createAddRepairStyles>;
