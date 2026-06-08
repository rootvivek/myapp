import React from 'react';
import { Pressable, Text, View, type TextStyle, type ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Copy } from 'lucide-react-native';

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
  chipColor = '#C084FC',
  onChipPress,
  styles,
  iconColor,
}: Props) {
  return (
    <View style={styles.infoRow}>
      <LinearGradient colors={[iconBg, 'transparent']} style={styles.infoIcon}>
        <Icon size={16} color={iconColor || '#fff'} strokeWidth={1.8} />
      </LinearGradient>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, highlight && styles.infoValueHighlight]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {chip && (
        <Pressable onPress={onChipPress} style={styles.chip}>
          {ChipIcon ? (
            <ChipIcon size={12} color={chipColor} strokeWidth={2.5} />
          ) : (
            <Copy size={12} color={chipColor} strokeWidth={2.5} />
          )}
          {chip !== ' ' && <Text style={styles.chipText}>{chip}</Text>}
        </Pressable>
      )}
    </View>
  );
});
