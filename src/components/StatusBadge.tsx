import React, { useMemo } from 'react';
import { AppChip } from './ui/AppChip';
import { useTheme } from '../context/ThemeContext';
import { sizes } from '../theme';
import type { RepairStatus } from '../types/repair';

export const StatusBadge = React.memo(function StatusBadge({
  status,
  label,
}: {
  status: RepairStatus;
  label: string;
}) {
  const { colors } = useTheme();

  // Status colours come straight from the theme's `status*` tokens so the
  // badge follows the active mode (light / dark) automatically.
  const customColors = useMemo(() => {
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
  }, [status, colors]);

  return (
    <AppChip
      variant="default"
      containerStyle={{
        backgroundColor: customColors.bg,
        borderColor: customColors.border,
        borderWidth: sizes.hairline,
      }}
      labelStyle={{
        color: customColors.text,
        fontSize: 11,
        fontWeight: '700',
        marginVertical: 1,
        marginHorizontal: 3,
      }}
    >
      {label}
    </AppChip>
  );
});
