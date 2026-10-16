import { StyleSheet } from 'react-native';

import type { AppColors } from '../../theme';

export function createRepairInfoStyles(colors: AppColors) {
  return StyleSheet.create({
    infoCodeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flex: 1,
    },
    orderCode: {
      textAlign: 'right',
      color: colors.textMuted,
    },
  });
}