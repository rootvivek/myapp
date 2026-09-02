import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Package } from 'lucide-react-native';
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
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Package size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Accessories Received</Text>
        </View>
      </View>

      <View style={localStyles.cardRow}>
        {ACCESSORY_UI.map(({ icon: AccIcon, title, key }, index) => (
          <View
            key={key}
            style={[
              localStyles.itemContainer,
              index > 0 && { borderLeftWidth: 1, borderLeftColor: colors.border, paddingLeft: 12 },
              index === 0 && { paddingRight: 10 },
            ]}
          >
            <View style={localStyles.headerRow}>
              <AccIcon color={colors.accent} size={16} />
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
    </View>
  );
});

const localStyles = StyleSheet.create({
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    gap: 6,
    marginBottom: 6,
  },
  titleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 28,
  },
  outerCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  radioLabel: {
    fontSize: 12.5,
  },
});

