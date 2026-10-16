import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';

export function createInfoRowStyles(colors: AppColors, iconBackground: string) {
  return StyleSheet.create({
    icon: {
      backgroundColor: iconBackground,
    },
  });
}