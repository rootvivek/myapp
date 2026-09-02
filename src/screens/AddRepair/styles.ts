import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { accentAlpha, radius, spacing } from '../../theme';

export function createAddRepairStyles(colors: AppColors) {
  const COLORS = {
    bg: colors.bg,
    card: colors.surface,
    border: colors.border,
    input: colors.surface2,
    primary: colors.accent,
    secondary: colors.accent,
    text: colors.text,
    subText: colors.textMuted,
  };

  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: COLORS.bg,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: 120,
      gap: spacing.sm + 4,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      marginBottom: 2,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTextWrap: {
      marginLeft: spacing.sm + 4,
      flex: 1,
    },
    headerTitle: {
      color: COLORS.text,
      fontSize: 20,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      color: COLORS.subText,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },

    /* Order Banner (Edit mode) */
    orderBanner: {
      backgroundColor: COLORS.card,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    orderBannerLabel: {
      color: COLORS.subText,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    orderBannerValue: {
      color: COLORS.primary,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    /* Unified Form Card Container */
    formCard: {
      backgroundColor: COLORS.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: spacing.sm + 4,
    },
    cardHeaderIcon: {
      width: 30,
      height: 30,
      borderRadius: radius.sm + 2,
      backgroundColor: accentAlpha(COLORS.primary, 0.12),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: accentAlpha(COLORS.primary, 0.25),
    },
    cardHeaderInfo: {
      flex: 1,
    },
    cardTitle: {
      color: COLORS.text,
      fontSize: 14.5,
      fontWeight: '800',
      letterSpacing: -0.2,
    },

    /* Customer 1-Row & Search */
    searchCustomerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    searchCustomerInput: {
      flex: 1,
      backgroundColor: COLORS.input,
      fontSize: 13.5,
    },
    newCustomerBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      backgroundColor: COLORS.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: -2,
    },
    customer1Row: {
      flexDirection: 'row',
      gap: 8,
    },

    /* Field Labels & Inputs */
    fieldLabel: {
      color: COLORS.subText,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 5,
      marginTop: 4,
    },
    paperInput: {
      backgroundColor: COLORS.input,
      marginBottom: 8,
      fontSize: 14,
    },
    imeiRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    imeiInput: {
      flex: 1,
      backgroundColor: COLORS.input,
      fontSize: 14,
    },
    scanBtn: {
      borderRadius: radius.md,
      backgroundColor: COLORS.primary,
      height: 48,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: -2,
    },
    scanBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700',
    },

    /* Dropdown suggestions */
    suggestionsContainer: {
      backgroundColor: COLORS.input,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: radius.md,
      marginTop: -6,
      marginBottom: 8,
      overflow: 'hidden',
    },
    suggestionItem: {
      padding: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: COLORS.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    suggestionName: {
      color: COLORS.text,
      fontWeight: '600',
      fontSize: 13.5,
    },
    suggestionPhone: {
      color: COLORS.subText,
      fontSize: 11.5,
    },
    brandSuggestContainer: {
      backgroundColor: COLORS.input,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: radius.md,
      marginTop: -6,
      marginBottom: 8,
      overflow: 'hidden',
      maxHeight: 180,
    },

    /* Problem Chips */
    problemSuggestions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
      marginBottom: 4,
    },

    /* Security Lock */
    lockTypeRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      marginTop: 4,
      marginBottom: 8,
    },

    /* Accessories & Warranty */
    accessoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.input,
      padding: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginBottom: 8,
    },
    accessoryTitle: {
      color: COLORS.text,
      fontSize: 13.5,
      fontWeight: '600',
    },
    accessoryToggle: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 2,
    },
    toggleBtn: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: radius.sm - 2,
    },
    toggleBtnActive: {
      backgroundColor: COLORS.primary,
    },
    toggleText: {
      color: COLORS.subText,
      fontSize: 12,
      fontWeight: '700',
    },
    toggleTextActive: {
      color: '#FFFFFF',
    },

    /* Billing section */
    billingRow: {
      flexDirection: 'row',
      gap: 10,
    },
    balancePreviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.input,
      padding: 10,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: COLORS.border,
      marginVertical: 6,
    },
    balanceLabel: {
      color: COLORS.subText,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    balanceValue: {
      fontSize: 15,
      fontWeight: '800',
    },

    /* Switch row */
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    switchLabel: {
      color: COLORS.text,
      fontSize: 13.5,
      fontWeight: '600',
      flex: 1,
    },

    /* Modal styles */
    modalWrap: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalOuter: {
      zIndex: 1,
      width: '100%',
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '800',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    modalSub: {
      color: colors.textMuted,
      fontSize: 13,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    modalCloseBtn: {
      position: 'absolute',
      top: spacing.md,
      right: spacing.md,
      zIndex: 10,
      padding: 4,
    },
    paymentModalBody: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    paymentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 13,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      gap: 8,
    },
    paymentButtonText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
  });
}

export type AddRepairStyles = ReturnType<typeof createAddRepairStyles>;


