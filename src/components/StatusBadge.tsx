import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius } from '../theme';
import type { RepairStatus } from '../types/repair';

const STATUS_COLORS: Record<RepairStatus, string> = {
  pending: '#eab308',
  in_progress: '#3b82f6',
  completed: '#22c55e',
  delivered: '#a855f7',
};

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    wrap: {
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      backgroundColor: colors.chipBg,
    },
    text: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}

export function StatusBadge({ status, label }: { status: RepairStatus; label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.wrap, { borderColor: STATUS_COLORS[status] }]}>
      <Text style={[styles.text, { color: STATUS_COLORS[status] }]}>{label}</Text>
    </View>
  );
}
