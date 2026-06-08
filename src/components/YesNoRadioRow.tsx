import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = {
  label: string;
  value: boolean;
  onChange: (yes: boolean) => void;
};

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 8,
      fontWeight: '500',
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    optionOn: {
      borderColor: colors.accent,
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
    },
    dot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.textMuted,
    },
    dotOn: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    optionText: {
      color: colors.textMuted,
      fontSize: 15,
      fontWeight: '600',
    },
    optionTextOn: {
      color: colors.text,
    },
  });
}

export function YesNoRadioRow({ label, value, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange(true)}
          style={[styles.option, value === true && styles.optionOn]}
          android_ripple={{ color: colors.border }}
        >
          <View style={[styles.dot, value === true && styles.dotOn]} />
          <Text style={[styles.optionText, value === true && styles.optionTextOn]}>Yes</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(false)}
          style={[styles.option, value === false && styles.optionOn]}
          android_ripple={{ color: colors.border }}
        >
          <View style={[styles.dot, value === false && styles.dotOn]} />
          <Text style={[styles.optionText, value === false && styles.optionTextOn]}>No</Text>
        </Pressable>
      </View>
    </View>
  );
}
