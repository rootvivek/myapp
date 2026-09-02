import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';

export function createStyles(colors: AppColors, mode: 'light' | 'dark') {
  const isLight = mode === 'light';
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bgGradient[0] || colors.bg },
    scroll: { paddingBottom: spacing.xl },

    /* Header */
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    headerBtn: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: isLight ? colors.surface2 : 'rgba(246, 234, 234, 0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      flex: 1,
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },

    /* Order code card */
    orderCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
    },
    orderCardInner: { padding: spacing.md, gap: spacing.xs },
    orderCodeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    orderCode: {
      color: '#fff',
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    orderId: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: 12,
      fontWeight: '500',
      marginTop: 2,
    },

    /* Info rows */
    infoCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    infoCardInner: { padding: spacing.md, gap: spacing.md },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoContent: { flex: 1, minWidth: 0 },
    infoLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      marginTop: 2,
    },
    infoValueHighlight: { color: colors.accent },
    chip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 99,
      backgroundColor: isLight ? colors.surface2 : 'rgba(167,139,250,0.12)',
    },
    chipText: { color: colors.accent, fontSize: 12, fontWeight: '600' },
    patternDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 48,
      marginTop: -4,
      marginBottom: 8,
      gap: spacing.md,
    },
    patternDetailContainer: {
      padding: 6,
      backgroundColor: isLight ? colors.surface2 : 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    patternTextContainer: {
      flex: 1,
    },
    patternLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    patternValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },

    /* Section title */
    sectionTitle: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    sectionTitleText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    /* Accessory rows */
    accessoryCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    accessoryCardInner: { padding: spacing.md, gap: spacing.md },
    accessoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accessoryLabel: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
    accessoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 99,
    },
    accessoryBadgeText: { fontSize: 12, fontWeight: '700' },

    /* Photos */
    photoCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    photoCardInner: { padding: spacing.md, gap: spacing.sm },
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    photoItem: {
      width: '47%',
      aspectRatio: 1,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: isLight ? colors.surface2 : 'rgba(255,255,255,0.04)',
    },
    photoImg: { width: '100%', height: '100%' },
    photoLabel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: 6,
      paddingHorizontal: 10,
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    photoLabelText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
    noPhotos: {
      color: colors.textMuted,
      fontSize: 13,
      fontStyle: 'italic',
    },

    /* Payment card */
    paymentCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: isLight ? 1 : 0,
      borderColor: colors.border,
    },
    paymentCardInner: { padding: spacing.md, gap: spacing.sm },
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
    paymentValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    paymentValueAccent: { color: colors.accent },
    paymentValueGreen: { color: colors.success },
    paymentDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },

    /* Action buttons */
    actions: {
      marginHorizontal: spacing.md,
      marginTop: spacing.sm,
      gap: spacing.sm,
    },
    actionBtn: { borderRadius: 14, overflow: 'hidden' },
    actionBtnInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: 16,
    },
    actionBtnText: {
      color: '#fff',
      fontSize: 15,
      fontWeight: '700',
    },
    actionBtnSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      backgroundColor: isLight ? colors.surface : 'rgba(255,255,255,0.04)',
    },
    actionBtnSecondaryText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },

    /* Loading / error */
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    muted: { color: colors.textMuted },
  });
}
