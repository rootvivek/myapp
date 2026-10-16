import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Repair } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';
import { AppCard } from '../../../components/ui/AppCard';
import { AppChip } from '../../../components/ui/AppChip';

type Props = {
  accessories: Pick<Repair, 'accSimTray' | 'accBackCover'>;
  onChangeAccessory: (key: 'accSimTray' | 'accBackCover', value: boolean) => void;
  styles: AddRepairStyles;
};

export const AccessoriesSection = React.memo(function AccessoriesSection({
  accessories,
  onChangeAccessory,
  styles,
}: Props) {
  const renderChoice = (
    label: 'Yes' | 'No',
    key: 'accSimTray' | 'accBackCover',
    value: boolean,
    isSelected: boolean
  ) => (
    <AppChip
      variant={isSelected ? 'primary' : 'default'}
      selected={isSelected}
      showSelectedCheck={false}
      onPress={() => onChangeAccessory(key, value)}
      accessibilityRole="button"
      accessibilityLabel={`${key === 'accSimTray' ? 'SIM tray' : 'Back cover'} ${label}`}
      containerStyle={localStyles.choice}
    >
      {label}
    </AppChip>
  );

  return (
    <AppCard>
      <Text style={styles.fieldLabel}>Accessories Received</Text>
      <View style={localStyles.row}>
        {/* SIM Tray */}
        <View style={localStyles.group}>
          <Text style={styles.fieldLabel}>SIM tray</Text>
          <View style={localStyles.chipRow}>
            {renderChoice('Yes', 'accSimTray', true, accessories.accSimTray)}
            {renderChoice('No', 'accSimTray', false, !accessories.accSimTray)}
          </View>
        </View>

        {/* Back Cover */}
        <View style={localStyles.group}>
          <Text style={styles.fieldLabel}>Back cover</Text>
          <View style={localStyles.chipRow}>
            {renderChoice('Yes', 'accBackCover', true, accessories.accBackCover)}
            {renderChoice('No', 'accBackCover', false, !accessories.accBackCover)}
          </View>
        </View>
      </View>
    </AppCard>
  );
});

const localStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  group: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  choice: {
    flex: 1,
  },
});
