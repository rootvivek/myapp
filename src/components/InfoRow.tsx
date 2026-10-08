import React from 'react';
import { Pressable, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import { Copy } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';

type InfoRowStyles = {
  infoRow: ViewStyle;
  infoIcon: ViewStyle;
  infoContent: ViewStyle;
  infoLabel: TextStyle;
  infoValue: TextStyle;
  infoValueHighlight: TextStyle;
  chip: ViewStyle;
  chipText: TextStyle;
};

type Props = {
  icon: React.ElementType;
  iconBg: string;
  label: string;
  value: string;
  highlight?: boolean;
  chip?: string;
  chipIcon?: React.ElementType;
  chipColor?: string;
  onChipPress?: () => void;
  styles: InfoRowStyles;
  iconColor?: string;
};

export const InfoRow = React.memo(function InfoRow({
  icon: Icon,
  iconBg,
  label,
  value,
  highlight,
  chip,
  chipIcon: ChipIcon,
  chipColor,
  onChipPress,
  styles,
  iconColor,
}: Props) {
  const { colors } = useTheme();
  const chipTint = chipColor ?? colors.accent;

  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: iconBg }]}>
        <Icon size={16} color={iconColor ?? colors.text} strokeWidth={1.8} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {chip && (
        <Pressable onPress={onChipPress} style={styles.chip}>
          {ChipIcon ? (
            <ChipIcon size={12} color={chipTint} strokeWidth={2.5} />
          ) : (
            <Copy size={12} color={chipTint} strokeWidth={2.5} />
          )}
          {chip !== ' ' && <Text style={styles.chipText}>{chip}</Text>}
        </Pressable>
      )}
    </View>
  );
});
