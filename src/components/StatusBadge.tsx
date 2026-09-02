import React, { useMemo } from 'react';
import { Chip } from 'react-native-paper';
import { useTheme } from '../context/ThemeContext';
import type { RepairStatus } from '../types/repair';

export const StatusBadge = React.memo(function StatusBadge({
  status,
  label,
}: {
  status: RepairStatus;
  label: string;
}) {
  const { colors } = useTheme();

  const sc = useMemo(() => {
    switch (status) {
      case 'pending':
        return { bg: colors.statusPendingBg, text: colors.statusPendingText, border: colors.statusPendingBorder };
      case 'in_progress':
        return { bg: colors.statusInProgressBg, text: colors.statusInProgressText, border: colors.statusInProgressBorder };
      case 'completed':
        return { bg: colors.statusCompletedBg, text: colors.statusCompletedText, border: colors.statusCompletedBorder };
      case 'delivered':
        return { bg: colors.statusDeliveredBg, text: colors.statusDeliveredText, border: colors.statusDeliveredBorder };
      case 'cancelled':
        return { bg: colors.statusCancelledBg, text: colors.statusCancelledText, border: colors.statusCancelledBorder };
      default:
        return { bg: colors.statusPendingBg, text: colors.statusPendingText, border: colors.statusPendingBorder };
    }
  }, [status, colors]);

  return (
    <Chip
      compact
      mode="outlined"
      style={{
        backgroundColor: sc.bg,
        borderColor: sc.border,
        borderRadius: 4,
      }}
      textStyle={{
        color: sc.text,
        fontSize: 13,
        fontWeight: '700',
        marginVertical: 2,
        marginHorizontal: 4,
      }}
    >
      {label}
    </Chip>
  );
});
