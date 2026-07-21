import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button as PaperButton, Chip as PaperChip, TextInput as PaperInput } from 'react-native-paper';
import { Lock } from 'lucide-react-native';
import { PatternDrawingModal, PatternPreview } from '../../../components/PatternDrawingModal';
import type { AppColors } from '../../../theme';
import { accentAlpha } from '../../../theme';
import type { LockType } from '../../../types/repair';
import { LOCK_TYPES } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';

type Props = {
  lockType: LockType;
  lockValue: string;
  onChangeLockType: (type: LockType) => void;
  onChangeLockValue: (val: string) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const LockSection = React.memo(function LockSection({
  lockType,
  lockValue,
  onChangeLockType,
  onChangeLockValue,
  styles,
  colors,
}: Props) {
  const [isPatternModalVisible, setIsPatternModalVisible] = useState(false);

  return (
    <>
      <View style={styles.lockCard}>
        <View style={styles.lockHeaderRow}>
          <View style={styles.accessoryIcon}>
            <Lock color={colors.accent} size={22} />
          </View>
          <Text style={styles.accessoryTitle}>Device security lock</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {LOCK_TYPES.map((lt) => {
              const isSelected = lockType === lt.value;
              return (
                <PaperChip
                  key={lt.value}
                  selected={isSelected}
                  mode="outlined"
                  showSelectedCheck={false}
                  onPress={() => {
                    onChangeLockType(lt.value);
                    onChangeLockValue('');
                  }}
                  style={{
                    backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                    borderColor: isSelected ? colors.accent : colors.border,
                    height: 32,
                  }}
                  textStyle={{
                    color: isSelected ? colors.accent : colors.textMuted,
                    fontWeight: isSelected ? '700' : '600',
                    fontSize: 11,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Lock type ${lt.label}`}
                >
                  {lt.label}
                </PaperChip>
              );
            })}
          </View>

          {/* Dynamic input depending on type */}
          {lockType === 'pattern' && (
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <PaperButton
                mode="contained"
                onPress={() => setIsPatternModalVisible(true)}
                style={[styles.scanPaperBtn, { flex: 1 }]}
                contentStyle={{ height: 32, paddingHorizontal: 4 }}
                labelStyle={{ fontSize: 11 }}
                buttonColor={colors.accent}
                textColor="#FFFFFF"
                icon={() => <Lock color="#FFFFFF" size={12} />}
                accessibilityRole="button"
                accessibilityLabel="Draw pattern lock"
              >
                {lockValue ? 'Redraw' : 'Draw'}
              </PaperButton>
              {lockValue ? (
                <View style={{ padding: 2, backgroundColor: colors.surface2, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
                  <PatternPreview path={lockValue} size={28} />
                </View>
              ) : null}
            </View>
          )}

          {lockType === 'password' && (
            <View style={{ flex: 1 }}>
              <PaperInput
                label="Password / PIN"
                placeholder="Enter Password or PIN"
                value={lockValue}
                onChangeText={onChangeLockValue}
                keyboardType="default"
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
                style={[styles.lockPaperInput, { marginTop: 0 }]}
                accessibilityLabel="Password or PIN"
              />
            </View>
          )}
        </View>
      </View>

      <PatternDrawingModal
        visible={isPatternModalVisible}
        onClose={() => setIsPatternModalVisible(false)}
        onSave={onChangeLockValue}
        initialPattern={lockValue}
      />
    </>
  );
});
