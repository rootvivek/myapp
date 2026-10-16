import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { sizes } from '../theme';
import type { RepairStatus } from '../types/repair';

function getStatusColors(status: RepairStatus, colors: AppColors) {
  switch (status) {
    case 'pending':
      return { bg: colors.statusPendingBg, text: colors.statusPendingText, border: colors.statusPendingBorder };
    case 'in_progress':
      return { bg: colors.statusInProgressBg, text: colors.statusInProgressText, border: colors.statusInProgressBorder };
    case 'completed':
      return { bg: colors.statusCompletedBg, text: colors.statusCompletedText, border: colors.statusCompletedBorder };
    case 'delivered':
      return { bg: colors.statusDeliveredBg, text: colors.statusDeliveredText, border: colors.statusDeliveredBorder };
    default:
      return { bg: colors.statusPendingBg, text: colors.statusPendingText, border: colors.statusPendingBorder };
  }
}

export function createStatusBadgeStyles(colors: AppColors, status: RepairStatus) {
  const statusColors = getStatusColors(status, colors);

  return StyleSheet.create({
    container: {
      backgroundColor: statusColors.bg,
      borderColor: statusColors.border,
      borderWidth: sizes.hairline,
    },
    label: {
      color: statusColors.text,
      fontSize: 11,
      fontWeight: '700',
      marginVertical: 1,
      marginHorizontal: 3,
    },
  });
}