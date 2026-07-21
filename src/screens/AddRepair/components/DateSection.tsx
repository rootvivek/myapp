import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import type { AddRepairStyles } from '../styles';

type Props = {
  dateReceived: string;
  onChangeDateReceived: (date: string) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const DateSection = React.memo(function DateSection({
  dateReceived,
  onChangeDateReceived,
  styles,
  colors,
}: Props) {
  const [showDate, setShowDate] = useState(false);
  const dateValue = new Date(dateReceived + 'T12:00:00');

  return (
    <>
      <Text style={styles.sectionTitle}>DATE</Text>
      <Pressable
        onPress={() => setShowDate(true)}
        accessibilityRole="button"
        accessibilityLabel={`Date received: ${dateReceived}`}
        accessibilityHint="Opens date picker"
      >
        <View pointerEvents="none">
          <PaperInput
            label="Date Received"
            value={dateReceived}
            editable={false}
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
            style={styles.paperInput}
            right={<PaperInput.Icon icon={() => <Calendar color={colors.accent} size={20} />} />}
          />
        </View>
      </Pressable>
      {showDate && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, d) => {
            if (Platform.OS === 'android') setShowDate(false);
            if (d) {
              const y = d.getFullYear();
              const m = String(d.getMonth() + 1).padStart(2, '0');
              const day = String(d.getDate()).padStart(2, '0');
              onChangeDateReceived(`${y}-${m}-${day}`);
            }
          }}
        />
      )}
      {Platform.OS === 'ios' && showDate && (
        <Pressable
          onPress={() => setShowDate(false)}
          style={{ alignSelf: 'flex-end', padding: 12, marginRight: 22 }}
          accessibilityRole="button"
          accessibilityLabel="Done picking date"
        >
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>Done</Text>
        </Pressable>
      )}
    </>
  );
});
