import { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = {
  label: string;
} & TextInputProps;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 6,
      fontWeight: '600',
    },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 16,
    },
    inputFocused: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
  });
}

export function Field({ label, style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, focused && styles.inputFocused, style]}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...rest}
      />
    </View>
  );
}
