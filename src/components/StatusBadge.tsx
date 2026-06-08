import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { RepairStatus } from '../types/repair';

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

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
    <View style={[styles.wrap, { backgroundColor: sc.bg, borderColor: sc.border }]}>
      <Text style={[styles.text, { color: sc.text }]}>{label}</Text>
    </View>
  );
});
