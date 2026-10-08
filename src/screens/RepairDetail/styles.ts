import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { accentAlpha, radius, sizes, spacing } from '../../theme';

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    scroll: {
      paddingBottom: 100,
      paddingTop: spacing.xs,
    },

    /* Section cards — fill, radius and border come from AppCard */
    sectionCard: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    sectionCardBody: {
      gap: spacing.md,
    },
    listCardBody: {
      gap: spacing.sm + 2,
    },
    photoCardBody: {
      gap: spacing.sm,
    },

    /* Hero / Header Card */
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: spacing.sm + 2,
      borderBottomWidth: sizes.hairline,
      borderBottomColor: colors.border,
    },
    customerName: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.3,
      flex: 1,
    },
    customerPhone: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
      marginTop: 2,
    },
    quickActionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    quickBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      gap: 6,
      flex: 1,
      justifyContent: 'center',
    },
    quickBtnCall: {
      backgroundColor: accentAlpha(colors.success, 0.12),
      borderColor: accentAlpha(colors.success, 0.25),
    },
    quickBtnHistory: {
      backgroundColor: accentAlpha(colors.accent, 0.12),
      borderColor: accentAlpha(colors.accent, 0.25),
    },
    quickBtnText: {
      fontSize: 12,
      fontWeight: '700',
    },

    /* Info card */
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    infoIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    infoContent: {
      flex: 1,
      minWidth: 0,
    },
    infoLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    infoValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
      marginTop: 2,
    },
    infoValueHighlight: {
      color: colors.accent,
      fontWeight: '700',
    },
    chip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: radius.full,
      backgroundColor: colors.surface2,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    chipText: {
      color: colors.accent,
      fontSize: 11.5,
      fontWeight: '700',
    },

    /* Lock section */
    patternDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 46,
      marginTop: -4,
      marginBottom: 6,
      gap: spacing.md,
    },
    patternDetailContainer: {
      padding: 6,
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    patternTextContainer: {
      flex: 1,
    },
    patternLabel: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    patternValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginTop: 2,
    },

    /* Section Title */
    sectionTitle: {
      marginHorizontal: spacing.md,
      marginTop: spacing.xs,
      marginBottom: spacing.xs + 2,
    },
    sectionTitleText: {
      color: colors.textMuted,
      fontSize: 11.5,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },

    /* Accessories */
    accessoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accessoryLabel: {
      color: colors.text,
      fontSize: 13.5,
      fontWeight: '600',
    },
    accessoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: radius.full,
    },
    accessoryBadgeText: {
      fontSize: 11.5,
      fontWeight: '700',
    },

    /* Photos */
    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    photoItem: {
      width: '47.5%',
      aspectRatio: 1,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface2,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    photoImg: {
      width: '100%',
      height: '100%',
    },
    photoLabel: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingVertical: 5,
      paddingHorizontal: 8,
      backgroundColor: 'rgba(0,0,0,0.65)',
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
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },

    /* Payment card */
    paymentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    paymentLabel: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
    },
    paymentValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    paymentValueAccent: {
      color: colors.warning,
    },
    paymentValueGreen: {
      color: colors.success,
    },
    paymentDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 2,
    },

    /* Action buttons */
    actions: {
      marginHorizontal: spacing.md,
      marginTop: spacing.xs,
      gap: spacing.sm,
    },

    /* Loading / error */
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    muted: {
      color: colors.textMuted,
    },
  });
}

