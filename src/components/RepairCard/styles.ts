import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { accentAlpha, spacing } from '../../theme';

const isDark = (colors: AppColors) => colors.text === '#FFFFFF';

export function createCardStyles(colors: AppColors) {
  const dark = isDark(colors);

  return StyleSheet.create({
    /* ── Card Container ────────────── */
    card: {
      backgroundColor: dark ? 'rgba(10, 12, 28, 0.75)' : 'rgba(255, 255, 255, 0.55)',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: dark ? 'rgba(124, 58, 237, 0.25)' : 'rgba(124, 58, 237, 0.15)',
      overflow: 'hidden',
      marginBottom: 6,
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: dark ? 0.15 : 0.08,
      shadowRadius: 8,
      elevation: 0,
      padding: 8,
    },
    body: {
      flexDirection: 'row',
      alignItems: 'stretch',
    },

    /* ── Left Image ────────────────── */
    imgWrap: {
      width: 100,
      justifyContent: 'center',
      position: 'relative',
    },
    img: {
      width: 100,
      height: 100,
      borderRadius: 8,
      backgroundColor: colors.surface2,
    },
    badge: {
      position: 'absolute',
      bottom: 6,
      left: 6,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    badgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },

    /* ── Center Content ────────────── */
    content: {
      flex: 1,
      paddingHorizontal: 8,
      justifyContent: 'center',
      gap: 3,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    infoLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      width: 64,
    },
    infoValue: {
      flex: 1,
      color: colors.text,
      fontSize: 12,
      fontWeight: '500',
    },
    addedBy: {
      fontSize: 10,
      color: colors.textMuted,
      fontWeight: '600',
      marginTop: 2,
    },

    /* ── Action Buttons ────────────── */
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
    actionIcon: {
      fontSize: 12,
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
    disabled: {
      opacity: 0.5,
    },

    /* ── Badges Row ─────────────────── */
    badgesRow: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    badgesScrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
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
      fontSize: 11,
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
