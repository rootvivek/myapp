import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AddRepairStyles } from '../styles';
import { WARRANTY_OPTIONS } from '../constants';
import type { WarrantyType } from '../types';
import { AppCard } from '../../../components/ui/AppCard';
import { AppChip } from '../../../components/ui/AppChip';

type Props = {
  warranty: string;
  warrantyType: WarrantyType;
  onChangeWarranty: (w: string) => void;
  onChangeWarrantyType: (wt: WarrantyType) => void;
  styles: AddRepairStyles;
};

export const WarrantySection = React.memo(function WarrantySection({
  warrantyType,
  onChangeWarranty,
  onChangeWarrantyType,
  styles,
}: Props) {
  const localStyles = StyleSheet.create({
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
  });

  return (
    <AppCard>
      <Text style={styles.fieldLabel}>Warranty Period</Text>

      <View style={localStyles.chipsRow}>
        {WARRANTY_OPTIONS.map((opt) => {
          const isSelected = warrantyType === opt.type;
          return (
            <AppChip
              key={opt.type}
              variant={isSelected ? 'primary' : 'default'}
              selected={isSelected}
              showSelectedCheck={false}
              onPress={() => {
                onChangeWarrantyType(opt.type);
                onChangeWarranty(opt.value);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Warranty option ${opt.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              {opt.label}
            </AppChip>
          );
        })}
      </View>
    </AppCard>
  );
});
