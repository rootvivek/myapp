import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';

export function createRepairActionsStyles(colors: AppColors, pill: { bg: string; text: string; border: string }) {
  return StyleSheet.create({
    statusChip: {
      backgroundColor: pill.bg,
      borderColor: pill.border,
      flexShrink: 1,
      minHeight: 28,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    statusLabel: {
      color: pill.text,
      fontWeight: '700',
      fontSize: 11,
      lineHeight: 14,
      marginVertical: 0,
      marginLeft: 0,
      marginRight: 0,
    },
    statusContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statusText: {
      color: pill.text,
      fontWeight: '700',
      fontSize: 11,
      lineHeight: 14,
    },
  });
}