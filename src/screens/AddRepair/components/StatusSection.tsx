import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Chip as PaperChip } from 'react-native-paper';
import type { AppColors } from '../../../theme';
import { accentAlpha } from '../../../theme';
import type { RepairStatus } from '../../../types/repair';
import { REPAIR_STATUSES } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';

type Props = {
  status: RepairStatus;
  onChangeStatus: (s: RepairStatus) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const StatusSection = React.memo(function StatusSection({
  status,
  onChangeStatus,
  styles,
  colors,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>STATUS</Text>
      <View style={styles.statusCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.statusRow}>
            {REPAIR_STATUSES.map((s) => {
              const isSelected = status === s.value;
              return (
                <PaperChip
                  key={s.value}
                  selected={isSelected}
                  showSelectedCheck={false}
                  mode="outlined"
                  onPress={() => onChangeStatus(s.value)}
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
                  accessibilityLabel={`Status ${s.label}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {s.label}
                </PaperChip>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </>
  );
});
