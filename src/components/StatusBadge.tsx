import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius } from '../theme';
import type { RepairStatus } from '../types/repair';

const STATUS_COLORS: Record<RepairStatus, { bg: string; text: string }> = {
  pending: { bg: 'rgba(234, 179, 8, 0.15)', text: '#fbbf24' },
  in_progress: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
  completed: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' },
  delivered: { bg: 'rgba(168, 85, 247, 0.15)', text: '#c084fc' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
};

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    wrap: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    text: {
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
  });
}

export function StatusBadge({ status, label }: { status: RepairStatus; label: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusColor = STATUS_COLORS[status];
  return (
    <View style={[styles.wrap, { backgroundColor: statusColor.bg, borderColor: statusColor.text }]}>
      <Text style={[styles.text, { color: statusColor.text }]}>{label}</Text>
    </View>
  );
}
