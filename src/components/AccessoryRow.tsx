import React from 'react';
import { Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { accentAlpha } from '../theme';

type AccessoryRowStyles = {
  accessoryRow: ViewStyle;
  accessoryLabel: TextStyle;
  accessoryBadge: ViewStyle;
  accessoryBadgeText: TextStyle;
};

type Props = {
  label: string;
  value: boolean;
  styles: AccessoryRowStyles;
};

export const AccessoryRow = React.memo(function AccessoryRow({ label, value, styles }: Props) {
  const { colors } = useTheme();
  const yes = value;
  const activeColor = yes ? colors.success : colors.danger;
  const badgeBg = accentAlpha(activeColor, 0.12);

  return (
    <View style={styles.accessoryRow}>
      <Text style={styles.accessoryLabel}>{label}</Text>
      <View
        style={[
          styles.accessoryBadge,
          { backgroundColor: badgeBg },
        ]}
      >
        {yes ? (
          <Check size={14} color={activeColor} strokeWidth={2.5} />
        ) : (
          <X size={14} color={activeColor} strokeWidth={2.5} />
        )}
        <Text style={[styles.accessoryBadgeText, { color: activeColor }]}>
          {yes ? 'Yes' : 'No'}
        </Text>
      </View>
    </View>
  );
});
