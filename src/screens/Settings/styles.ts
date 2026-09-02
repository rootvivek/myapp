import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';

export function createStyles(colors: AppColors) {
  function accentAlpha(hex: string, alpha: number) {
    const clean = hex.replace('#', '');
    if (clean.length !== 6) return `rgba(59, 130, 246, ${alpha})`;
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

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
      padding: 16,
      paddingBottom: 40,
      gap: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      marginBottom: 4,
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    headerSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      marginTop: 2,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: accentAlpha(colors.accent, 0.15),
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
      top: -4,
      right: -4,
      backgroundColor: '#FEF3C7',
      borderRadius: 10,
      padding: 3,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    cardHeaderInfo: {
      flex: 1,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    cardSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      flex: 1,
    },
    rowInfo: {
      flex: 1,
    },
    rowTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    rowSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 2,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: accentAlpha(colors.accent, 0.1),
      justifyContent: 'center',
      alignItems: 'center',
    },
    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 12,
      marginBottom: 6,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    inputIconBox: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      height: 44,
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    saveBtn: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 4,
    },
    saveBtnText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
    logoContainer: {
      marginBottom: 12,
    },
    logoPreviewWrapper: {
      width: '100%',
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      backgroundColor: colors.surface2,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    logoPreview: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    logoActionOverlay: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      flexDirection: 'row',
      gap: 8,
    },
    logoMiniBtn: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoMiniBtnDanger: {
      borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    logoMiniBtnText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    logoMiniBtnDangerText: {
      color: colors.danger,
    },
    logoPlaceholder: {
      width: '100%',
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      backgroundColor: colors.surface2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoUploadCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: accentAlpha(colors.accent, 0.12),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    logoPlaceholderTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    logoPlaceholderSub: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
  });
}
