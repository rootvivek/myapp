import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Chip as PaperChip } from 'react-native-paper';
import { Clock } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { accentAlpha } from '../../../theme';
import type { RepairStatus } from '../../../types/repair';
import { REPAIR_STATUSES } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';

type Props = {
  status: RepairStatus;
  onChangeStatus: (s: RepairStatus) => void;
  isEdit: boolean;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const StatusSection = React.memo(function StatusSection({
  status,
  onChangeStatus,
  isEdit,
  styles,
  colors,
}: Props) {
  const visibleStatuses = isEdit
    ? REPAIR_STATUSES
    : REPAIR_STATUSES.filter((s) => s.value !== 'cancelled');

  return (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Clock size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Job Status</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {visibleStatuses.map((s) => {
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
                  borderRadius: 8,
                  height: 32,
                }}
                textStyle={{
                  color: isSelected ? colors.accent : colors.textMuted,
                  fontWeight: isSelected ? '700' : '600',
                  fontSize: 11.5,
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
  );
});


