import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Chip as PaperChip, TextInput as PaperInput } from 'react-native-paper';
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
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Lock size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Device Security Lock</Text>
        </View>
      </View>

      <View style={styles.lockTypeRow}>
        {LOCK_TYPES.map((lt) => {
          const isSelected = lockType === lt.value;
          return (
            <PaperChip
              key={lt.value}
              selected={isSelected}
              mode="outlined"
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
              accessibilityLabel={`Lock type ${lt.label}`}
            >
              {lt.label}
            </PaperChip>
          );
        })}
      </View>

      {/* Dynamic input depending on type */}
      {lockType === 'pattern' && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <Pressable
            onPress={() => setIsPatternModalVisible(true)}
            style={({ pressed }) => [
              styles.scanBtn,
              { flex: 1, height: 42, marginTop: 0 },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Draw pattern lock"
          >
            <Lock color="#FFFFFF" size={15} />
            <Text style={styles.scanBtnText}>{lockValue ? 'Redraw Pattern' : 'Draw Pattern'}</Text>
          </Pressable>

          {lockValue ? (
            <View style={{ padding: 4, backgroundColor: colors.surface2, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
              <PatternPreview path={lockValue} size={36} />
            </View>
          ) : null}
        </View>
      )}

      {lockType === 'password' && (
        <PaperInput
          label="PIN or Password"
          placeholder="Enter unlock PIN or password"
          value={lockValue}
          onChangeText={onChangeLockValue}
          mode="outlined"
          dense={true}
          outlineColor={colors.border}
          activeOutlineColor={colors.accent}
          textColor={colors.text}
          placeholderTextColor={colors.textMuted}
          theme={{
            colors: {
              background: colors.surface2,
              placeholder: colors.textMuted,
            },
          }}
          style={[styles.paperInput, { marginBottom: 0 }]}
          left={<PaperInput.Icon icon={() => <Lock color={colors.accent} size={18} />} />}
          accessibilityLabel="Password or PIN"
        />
      )}

      <PatternDrawingModal
        visible={isPatternModalVisible}
        onClose={() => setIsPatternModalVisible(false)}
        onSave={onChangeLockValue}
        initialPattern={lockValue}
      />
    </View>
  );
});

