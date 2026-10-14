import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Lock } from 'lucide-react-native';
import { PatternDrawingModal, PatternPreview } from '../../../components/PatternDrawingModal';
import { radius, sizes, type AppColors } from '../../../theme';
import { FormTextInput } from '../../../components/FormTextInput';
import type { LockType } from '../../../types/repair';
import { LOCK_TYPES } from '../../../types/repair';
import type { AddRepairStyles } from '../styles';
import { AppButton } from '../../../components/ui/AppButton';
import { AppCard } from '../../../components/ui/AppCard';
import { AppChip } from '../../../components/ui/AppChip';

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
    <AppCard>
      <Text style={styles.fieldLabel}>Device Security Lock</Text>

      <View style={[localStyles.typesRow, { marginBottom: lockType ? 8 : 0 }]}>
        {LOCK_TYPES.map((lt) => {
          const isSelected = lockType === lt.value;
          return (
            <AppChip
              key={lt.value}
              variant={isSelected ? 'primary' : 'default'}
              selected={isSelected}
              showSelectedCheck={false}
              onPress={() => {
                if (isSelected) {
                  onChangeLockType('');
                  onChangeLockValue('');
                } else {
                  onChangeLockType(lt.value);
                  onChangeLockValue('');
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`Lock type ${lt.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              {lt.label}
            </AppChip>
          );
        })}
      </View>

      {/* Pattern Type */}
      {lockType === 'pattern' && (
        <View style={localStyles.patternRow}>
          <AppButton
            variant="secondary"
            leftIcon={<Lock size={14} color={colors.accent} strokeWidth={2.2} />}
            onPress={() => setIsPatternModalVisible(true)}
            accessibilityLabel="Draw pattern lock"
            containerStyle={{ flex: 1 }}
          >
            {lockValue ? 'Redraw Pattern' : 'Draw Pattern'}
          </AppButton>

          {lockValue ? (
            <View
              style={[
                localStyles.previewBox,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                },
              ]}
            >
              <PatternPreview path={lockValue} size={36} />
            </View>
          ) : null}
        </View>
      )}

      {/* Password / PIN Type */}
      {lockType === 'password' && (
        <FormTextInput
          label="Lock Code / Password"
          placeholder="Enter PIN or password"
          value={lockValue}
          onChangeText={onChangeLockValue}
          autoCapitalize="none"
          containerStyle={styles.inputTight}
          accessibilityLabel="Lock password or PIN"
        />
      )}

      <PatternDrawingModal
        visible={isPatternModalVisible}
        onClose={() => setIsPatternModalVisible(false)}
        onSave={(path) => {
          onChangeLockValue(path);
          setIsPatternModalVisible(false);
        }}
      />
    </AppCard>
  );
});

const localStyles = StyleSheet.create({
  typesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  previewBox: {
    padding: 3,
    borderRadius: radius.md,
    borderWidth: sizes.hairline,
  },
});
