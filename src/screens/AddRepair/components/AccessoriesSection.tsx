import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

      <View style={[localStyles.cardRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {ACCESSORY_UI.map(({ icon: AccIcon, title, key }, index) => (
          <View
            key={key}
            style={[
              localStyles.itemContainer,
              index > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 14 },
              index === 0 && { paddingRight: 10 },
            ]}
          >
            <View style={localStyles.headerRow}>
              <AccIcon color={colors.accent} size={18} />
              <Text style={[localStyles.titleText, { color: colors.text }]} numberOfLines={1}>
                {title}
              </Text>
            </View>

            <View style={localStyles.radioGroup}>
              {/* Radio Option: YES */}
              <Pressable
                onPress={() => onChangeAccessory(key, true)}
                style={localStyles.radioButton}
                accessibilityRole="radio"
                accessibilityLabel={`${title} Yes`}
                accessibilityState={{ checked: accessories[key] }}
              >
                <View
                  style={[
                    localStyles.outerCircle,
                    { borderColor: accessories[key] ? colors.accent : colors.textMuted },
                  ]}
                >
                  {accessories[key] && (
                    <View style={[localStyles.innerCircle, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <Text
                  style={[
                    localStyles.radioLabel,
                    { color: accessories[key] ? colors.accent : colors.textMuted, fontWeight: accessories[key] ? '700' : '500' },
                  ]}
                >
                  Yes
                </Text>
              </Pressable>

              {/* Radio Option: NO */}
              <Pressable
                onPress={() => onChangeAccessory(key, false)}
                style={localStyles.radioButton}
                accessibilityRole="radio"
                accessibilityLabel={`${title} No`}
                accessibilityState={{ checked: !accessories[key] }}
              >
                <View
                  style={[
                    localStyles.outerCircle,
                    { borderColor: !accessories[key] ? colors.accent : colors.textMuted },
                  ]}
                >
                  {!accessories[key] && (
                    <View style={[localStyles.innerCircle, { backgroundColor: colors.accent }]} />
                  )}
                </View>
                <Text
                  style={[
                    localStyles.radioLabel,
                    { color: !accessories[key] ? colors.accent : colors.textMuted, fontWeight: !accessories[key] ? '700' : '500' },
                  ]}
                >
                  No
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </>
  );
});

const localStyles = StyleSheet.create({
  cardRow: {
    marginHorizontal: 18,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 32,
  },
  outerCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  radioLabel: {
    fontSize: 13,
  },
});
