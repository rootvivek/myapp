import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { accentAlpha, radius, spacing } from '../../theme';

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
      paddingHorizontal: spacing.sm + 4,
      paddingTop: spacing.xs,
      paddingBottom: 100,
      gap: spacing.sm + 2,
    },

    /* Profile Hero Header - Compressed */
    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.sm + 4,
      borderWidth: 1,
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
      borderRadius: 23,
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
      backgroundColor: '#FEF3C7',
      borderRadius: 8,
      padding: 2,
      borderWidth: 1,
      borderColor: '#F59E0B',
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
      borderWidth: 1,
      borderColor: colors.border,
    },
    roleBadgeText: {
      fontSize: 10.5,
      fontWeight: '700',
      color: colors.accent,
    },

    /* Section Card - Compressed */
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.sm + 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
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
      borderWidth: 1,
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
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.sm,
    },
    logoCircleWrapper: {
      width: 54,
      height: 54,
      borderRadius: 27,
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

    /* Form Fields - Compressed */
    label: {
      color: colors.textMuted,
      fontSize: 10.5,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 4,
      marginBottom: 4,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 10,
      marginBottom: 6,
      height: 40,
    },
    inputIconBox: {
      marginRight: 6,
    },
    input: {
      flex: 1,
      height: '100%',
      color: colors.text,
      fontSize: 13.5,
      fontWeight: '600',
      paddingVertical: 0,
    },

    /* Save Button */
    saveBtn: {
      borderRadius: radius.md,
      overflow: 'hidden',
      marginTop: 6,
    },
    saveBtnInner: {
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '700',
      letterSpacing: 0.2,
    },

    logoMiniBtn: {
      backgroundColor: colors.surface,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoMiniBtnDanger: {
      borderColor: 'rgba(239, 68, 68, 0.4)',
      backgroundColor: 'rgba(239, 68, 68, 0.08)',
    },
    logoMiniBtnText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '700',
    },
    logoMiniBtnDangerText: {
      color: colors.danger,
    },
  });
}


