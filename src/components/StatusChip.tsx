import React from 'react';
import { Pressable, StyleSheet, Text, type TextStyle, type ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { RepairStatus } from '../types/repair';

type Props = {
  label: string;
  icon?: string;
  onPress?: () => void;
  variant?: 'status' | 'filter';

  // For 'status' variant (passed from card)
  status?: RepairStatus;
  bg?: string;
  border?: string;
  text?: string;

  // For 'filter' variant
  active?: boolean;
};

export const StatusChip = React.memo(function StatusChip({
  label,
  icon,
  onPress,
  variant = 'status',
  bg,
  border,
  text,
  active,
}: Props) {
  const { colors } = useTheme();

  if (variant === 'filter') {
    const chipStyle: ViewStyle[] = [
      styles.filterChip,
      {
        borderColor: active ? colors.accent : colors.border,
        backgroundColor: active ? colors.accent : colors.surface,
      },
    ];

    const textStyle: TextStyle[] = [
      styles.filterChipText,
      {
        color: active ? '#FFFFFF' : colors.textMuted,
        fontWeight: active ? '700' : '600',
      },
    ];

    return (
      <Pressable
        onPress={onPress}
        style={chipStyle}
        android_ripple={{ color: 'rgba(255, 255, 255, 0.25)' }}
      >
        <Text style={textStyle}>
          {icon ? `${icon} ` : ''}{label}
        </Text>
      </Pressable>
    );
  }

  // Default 'status' variant
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.pill,
        { backgroundColor: bg, borderColor: border },
      ]}
    >
      {!!icon && <Text style={styles.pillIcon}>{icon}</Text>}
      <Text style={[styles.pillText, { color: text }]} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    flex: 1,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  pillIcon: { fontSize: 11 },
  pillText: { fontSize: 11, fontWeight: '700' },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 11.5,
    letterSpacing: 0.2,
  },
});
