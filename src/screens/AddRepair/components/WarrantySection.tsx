import React from 'react';
import { View, Text } from 'react-native';
import { Chip as PaperChip } from 'react-native-paper';
import { Shield } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { accentAlpha } from '../../../theme';
import { WARRANTY_OPTIONS } from '../constants';
import type { AddRepairStyles } from '../styles';
import type { WarrantyType } from '../types';

type Props = {
  warranty: string;
  warrantyType: WarrantyType;
  onChangeWarranty: (w: string) => void;
  onChangeWarrantyType: (wt: WarrantyType) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const WarrantySection = React.memo(function WarrantySection({
  warrantyType,
  onChangeWarranty,
  onChangeWarrantyType,
  styles,
  colors,
}: Props) {
  return (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Shield size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Warranty Period</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {WARRANTY_OPTIONS.map((opt) => {
          const isSelected = warrantyType === opt.type;
          return (
            <PaperChip
              key={opt.type}
              selected={isSelected}
              mode="outlined"
              showSelectedCheck={false}
              onPress={() => {
                onChangeWarrantyType(opt.type);
                onChangeWarranty(opt.value);
              }}
              style={{
                backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                borderColor: isSelected ? colors.accent : colors.border,
                borderRadius: 8,
                height: 32,
              }}
              textStyle={{
                color: isSelected ? colors.accent : colors.textMuted,
                fontWeight: isSelected ? '700' : '600',
                fontSize: 11.5,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Warranty option ${opt.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              {opt.label}
            </PaperChip>
          );
        })}
      </View>
    </View>
  );
});


