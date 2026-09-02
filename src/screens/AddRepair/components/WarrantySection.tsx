import React from 'react';
import { Text, View } from 'react-native';
import { Chip as PaperChip, TextInput as PaperInput } from 'react-native-paper';
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
  warranty,
  warrantyType,
  onChangeWarranty,
  onChangeWarrantyType,
  styles,
  colors,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>WARRANTY PERIOD</Text>
      <View style={styles.lockCard}>
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
                  borderRadius: 4,
                }}
                textStyle={{
                  color: isSelected ? colors.accent : colors.textMuted,
                  fontWeight: isSelected ? '700' : '600',
                  fontSize: 12,
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
    </>
  );
});
