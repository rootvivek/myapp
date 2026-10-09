import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { accentAlpha, radius, sizes, spacing } from '../../theme';

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.xs,
      paddingBottom: 100,
      gap: spacing.sm + 2,
    },

    /* Profile Hero Header - Compressed */
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.sm + 4,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: radius.full,
      backgroundColor: accentAlpha(colors.accent, 0.18),
      borderWidth: 1.5,
      borderColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: '800',
    },
    crownBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      backgroundColor: accentAlpha(colors.warning, 0.16),
      borderRadius: radius.sm,
      padding: 2,
      borderWidth: sizes.hairline,
      borderColor: colors.warning,
    },
    heroInfo: {
      flex: 1,
      minWidth: 0,
    },
    heroName: {
      color: colors.text,
      fontSize: 16.5,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    heroEmail: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '500',
      marginTop: 1,
    },
    roleBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface2,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.full,
      marginTop: 4,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
    },
    roleBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.accent,
    },

    /* Section Card - Compressed */
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: spacing.sm + 2,
    },
    cardHeaderInfo: {
      flex: 1,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 14.5,
      fontWeight: '800',
      letterSpacing: -0.2,
    },
    cardSubtitle: {
      color: colors.textMuted,
      fontSize: 11.5,
      fontWeight: '500',
      marginTop: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    rowInfo: {
      flex: 1,
    },
    rowTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    rowSubtitle: {
      color: colors.textMuted,
      fontSize: 11.5,
      fontWeight: '500',
      marginTop: 1,
    },
    iconBox: {
      width: 32,
      height: 32,
      borderRadius: radius.sm + 2,
      backgroundColor: accentAlpha(colors.accent, 0.12),
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: sizes.hairline,
      borderColor: accentAlpha(colors.accent, 0.2),
    },

    /* Side Circle Logo Layout */
    logoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 4,
      backgroundColor: colors.surface2,
      padding: 10,
      borderRadius: radius.md,
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    logoCircleWrapper: {
      width: 54,
      height: 54,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoCircleImage: {
      width: '100%',
      height: '100%',
    },
    logoInfoSide: {
      flex: 1,
      minWidth: 0,
    },
    logoSideTitle: {
      color: colors.text,
      fontSize: 13.5,
      fontWeight: '700',
    },
    logoSideSub: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '500',
      marginTop: 1,
      marginBottom: 6,
    },
    logoSideActions: {
      flexDirection: 'row',
      gap: 6,
    },

    /* Compact inline action buttons (Check Update / Upload / Remove) */
    inlineBtn: {
      minHeight: sizes.buttonHeightCompact,
    },
    inlineBtnLabel: {
      fontSize: 13,
    },

    /* Admin dashboard navigation row */
    adminRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
    },
    adminIconBox: {
      width: sizes.iconButton,
      height: sizes.iconButton,
      borderRadius: radius.md,
      backgroundColor: accentAlpha(colors.danger, 0.12),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm + 4,
    },
  });
}


