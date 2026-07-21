import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AppColors } from '../../../theme';
import type { Repair } from '../../../types/repair';
import { ACCESSORY_UI } from '../constants';
import type { AddRepairStyles } from '../styles';

type Props = {
  accessories: Pick<Repair, 'accSimTray' | 'accBackCover'>;
  onChangeAccessory: (key: 'accSimTray' | 'accBackCover', value: boolean) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const AccessoriesSection = React.memo(function AccessoriesSection({
  accessories,
  onChangeAccessory,
  styles,
  colors,
}: Props) {
  return (
    <>
      <Text style={styles.sectionTitle}>ACCESSORIES (RECEIVED WITH DEVICE)</Text>

      {ACCESSORY_UI.map(({ icon: AccIcon, title, key }) => (
        <View key={key} style={styles.accessoryCard}>
          <View style={styles.accessoryLeft}>
            <View style={styles.accessoryIcon}>
              <AccIcon color={colors.accent} size={22} />
            </View>
            <Text style={styles.accessoryTitle}>{title}</Text>
          </View>
          <View style={styles.accessoryToggle}>
            <Pressable
              onPress={() => onChangeAccessory(key, true)}
              style={[styles.toggleBtn, accessories[key] && styles.toggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel={`${title} Yes`}
              accessibilityState={{ selected: accessories[key] }}
            >
              <Text style={[styles.toggleText, accessories[key] && styles.toggleTextActive]}>Yes</Text>
            </Pressable>
            <Pressable
              onPress={() => onChangeAccessory(key, false)}
              style={[styles.toggleBtn, !accessories[key] && styles.toggleBtnActive]}
              accessibilityRole="button"
              accessibilityLabel={`${title} No`}
              accessibilityState={{ selected: !accessories[key] }}
            >
              <Text style={[styles.toggleText, !accessories[key] && styles.toggleTextActive]}>No</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </>
  );
});
