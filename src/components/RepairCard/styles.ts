import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { accentAlpha, radius, spacing } from '../../theme';

const isDark = (colors: AppColors) => colors.text === '#FFFFFF';

export function createCardStyles(colors: AppColors) {
  const dark = isDark(colors);

  return StyleSheet.create({
    /* ── Card Container ────────────── */
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      marginBottom: spacing.sm + 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: dark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      padding: spacing.md - 2,
    },

    /* ── Card Top Row ─────────────── */
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
      flex: 1,
      marginRight: spacing.sm,
    },
    orderCodeBadge: {
      backgroundColor: colors.surface2,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    orderCodeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 0.2,
    },
    customerName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },

    /* ── Payment Badge ─────────────── */
    paymentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      gap: 3,
    },
    paymentBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },

    /* ── Body ──────────────────────── */
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md - 4,
    },

    /* ── Image Thumbnail ───────────── */
    imgWrap: {
      width: 76,
      height: 76,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    img: {
      width: '100%',
      height: '100%',
    },

    /* ── Content ───────────────────── */
    content: {
      flex: 1,
      justifyContent: 'center',
      gap: 2,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },
    infoLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textMuted,
      width: 54,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    infoValue: {
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      lineHeight: 16,
    },
    costValue: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      flex: 1,
    },
    addedBy: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '500',
      marginTop: 2,
    },

    /* ── Card Footer / Actions ─────── */
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm + 2,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    statusChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.sm + 2,
      borderWidth: 1,
      gap: 5,
      flexShrink: 1,
    },
    statusIcon: {
      fontSize: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '700',
    },

    /* ── Action Buttons ────────────── */
    actionIconsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    iconBtn: {
      width: 32,
      height: 32,
      borderRadius: radius.sm + 2,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    callBtn: {
      backgroundColor: accentAlpha(colors.success, 0.12),
      borderColor: accentAlpha(colors.success, 0.25),
    },
    whatsappBtn: {
      backgroundColor: 'rgba(37,211,102,0.12)',
      borderColor: 'rgba(37,211,102,0.25)',
    },
    invoiceBtn: {
      backgroundColor: accentAlpha(colors.accent, 0.12),
      borderColor: accentAlpha(colors.accent, 0.25),
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      flex: 1,
      height: 28,
      backgroundColor: dark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
      borderRadius: 4,
      borderWidth: 1,
      borderColor: dark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
      paddingVertical: 2,
      paddingHorizontal: 4,
    },
    callText: {
      color: colors.success,
      fontSize: 11,
      fontWeight: '700',
    },
    whatsappText: {
      color: '#25D366',
      fontSize: 11,
      fontWeight: '700',
    },
    shareText: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '700',
    },
    badgePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      height: 28,
      borderRadius: 4,
      borderWidth: 1,
      paddingVertical: 2,
      paddingHorizontal: 8,
    },
    badgePillText: {
      fontSize: 11,
      fontWeight: '700',
    },
    badgePillIcon: {
      fontSize: 14,
    },
    disabled: {
      opacity: 0.5,
    },

    /* ── Modal Shared ──────────────── */
    modalWrap: {
      flex: 1,
      backgroundColor: dark ? 'rgba(5,8,22,0.85)' : 'rgba(15,23,42,0.45)',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    modalOuter: {
      zIndex: 1,
      width: '100%',
    },
    modalSheet: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(124,58,237,0.2)',
      overflow: 'hidden',
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 24,
      elevation: 12,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      letterSpacing: -0.3,
    },
    modalSub: {
      color: colors.textMuted,
      fontSize: 14,
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

    /* ── Status Modal ──────────────── */
    modalRow: {
      paddingVertical: 16,
      paddingHorizontal: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalRowCur: {
      backgroundColor: accentAlpha(colors.accent, 0.12),
    },
    modalRowText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    modalRowTextCur: {
      color: colors.accent,
      fontWeight: '700',
    },
    modalCancel: {
      paddingVertical: 16,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.surface2,
    },
    modalCancelText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 16,
    },

    /* ── Payment Modal ─────────────── */
    paymentModalBody: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    paymentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      gap: 8,
    },
    paymentButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
  });
}

export type CardStyles = ReturnType<typeof createCardStyles>;

