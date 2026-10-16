import { StyleSheet } from 'react-native';

import type { AppColors } from '../../../theme';

export function createKhataNavigatorStyles(colors: AppColors) {
  return StyleSheet.create({
    header: {
      backgroundColor: colors.surface,
    },
    content: {
      backgroundColor: colors.bg,
    },
  });
}