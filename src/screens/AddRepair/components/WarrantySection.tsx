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
  customWarranty: string;
  warrantyType: WarrantyType;
  onChangeWarranty: (w: string) => void;
  onChangeCustomWarranty: (cw: string) => void;
  onChangeWarrantyType: (wt: WarrantyType) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const WarrantySection = React.memo(function WarrantySection({
  warranty,
  customWarranty,
  warrantyType,
  onChangeWarranty,
  onChangeCustomWarranty,
  onChangeWarrantyType,
  styles,
  colors,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>WARRANTY PERIOD</Text>
      <View style={styles.lockCard}>
        <View style={styles.lockHeaderRow}>
          <View style={styles.accessoryIcon}>
            <Shield color={colors.accent} size={22} />
          </View>
          <Text style={styles.accessoryTitle}>Warranty coverage</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
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
                  if (opt.type !== 'custom') {
                    onChangeWarranty(opt.value);
                  } else {
                    onChangeWarranty(customWarranty);
                  }
                }}
                style={{
                  backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                  borderColor: isSelected ? colors.accent : colors.border,
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

        {warrantyType === 'custom' && (
          <View style={styles.lockInputContainer}>
            <PaperInput
              label="Custom warranty description"
              placeholder="e.g. 1 Year, 6 Months, Lifetime"
              value={customWarranty}
              onChangeText={(text) => {
                onChangeCustomWarranty(text);
                onChangeWarranty(text);
              }}
              mode="outlined"
              dense={true}
              outlineColor={colors.border}
              activeOutlineColor={colors.accent}
              textColor={colors.text}
              placeholderTextColor={colors.textMuted}
              theme={{
                colors: {
                  background: colors.surface,
                  placeholder: colors.textMuted,
                },
              }}
              style={styles.lockPaperInput}
              accessibilityLabel="Custom warranty description"
            />
          </View>
        )}
      </View>
    </>
  );
});
