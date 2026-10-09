import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';
import { accentAlpha, radius, sizes, spacing } from '../../theme';

export function createCardStyles(colors: AppColors) {
  return StyleSheet.create({
    /* ── Card Container ──────────────
       Fill, radius, border and padding come from AppCard. */
    card: {
      marginBottom: spacing.sm + 2,
      overflow: 'hidden',
      /** Tighter bottom padding — the footer row sits close to the card edge. */
      paddingBottom: 4,
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
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    orderCodeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
      letterSpacing: 0.2,
      textAlign: 'right',
    },
    customerName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },

    /* ── Body ──────────────────────── */
    body: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md - 4,
    },

    /* ── Image Thumbnail ───────────── */
    imgWrap: {
      width: 90,
      height: 90,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface2,
      borderWidth: sizes.hairline,
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
      gap: 4,
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
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      lineHeight: 16,
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
      marginTop: spacing.xs + 2,
      paddingTop: spacing.xs,
      borderTopWidth: sizes.hairline,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    statusIcon: {
      fontSize: 12,
    },

    /* ── Action Buttons ────────────── */
    actionIconsGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
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
    badgePillIcon: {
      fontSize: 14,
    },

    /* ── Payment Modal ─────────────── */
    paymentModalBody: {
      padding: spacing.lg,
      gap: spacing.md,
    },
  });
}

export type CardStyles = ReturnType<typeof createCardStyles>;

