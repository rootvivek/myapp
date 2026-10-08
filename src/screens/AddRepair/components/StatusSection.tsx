import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RepairStatus } from '../../../types/repair';
import { REPAIR_STATUSES } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';
import { AppCard } from '../../../components/ui/AppCard';
import { AppChip } from '../../../components/ui/AppChip';

type Props = {
  status: RepairStatus;
  onChangeStatus: (s: RepairStatus) => void;
  isEdit: boolean;
  styles: AddRepairStyles;
};

export const StatusSection = React.memo(function StatusSection({
  status,
  onChangeStatus,
  isEdit,
  styles,
}: Props) {
  const visibleStatuses = REPAIR_STATUSES;

  const localStyles = StyleSheet.create({
    chipsRow: {
      flexDirection: 'row',
      gap: 6,
    },
  });

  return (
    <AppCard>
      <Text style={styles.fieldLabel}>Job Status</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={localStyles.chipsRow}>
          {visibleStatuses.map((s) => {
            const isSelected = status === s.value;
            return (
              <AppChip
                key={s.value}
                variant={isSelected ? 'primary' : 'default'}
                selected={isSelected}
                showSelectedCheck={false}
                onPress={() => onChangeStatus(s.value)}
                accessibilityRole="button"
                accessibilityLabel={`Status ${s.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                {s.label}
              </AppChip>
            );
          })}
        </View>
      </ScrollView>
    </AppCard>
  );
});
