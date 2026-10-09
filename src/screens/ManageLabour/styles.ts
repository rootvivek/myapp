import { StyleSheet } from 'react-native';
import type { AppColors } from '../../theme';
import { spacing } from '../../theme';

export function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    list: {
      paddingHorizontal: spacing.gutter,
      paddingTop: spacing.md,
      paddingBottom: 40,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    cardInfo: {
      flex: 1,
    },
    cardName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    cardPhone: {
      fontSize: 13,
      color: colors.textMuted,
      marginTop: 2,
    },
    badge: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    empty: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xl,
      fontSize: 15,
    },
  });
}
