import React, { useState } from 'react';
import { Platform, Text } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { appFieldLabelStyle } from '../../../components/ui/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { AppCard } from '../../../components/ui/AppCard';

type Props = {
  dateReceived: string;
  onChangeDateReceived: (date: string) => void;
  colors: AppColors;
};

export const DateSection = React.memo(function DateSection({
  dateReceived,
  onChangeDateReceived,
  colors,
}: Props) {
  const [showDate, setShowDate] = useState(false);
  const dateValue = new Date(dateReceived + 'T12:00:00');

  return (
    <AppCard>
      <Text style={appFieldLabelStyle(colors)}>Received Date</Text>
      <AppButton
        variant="secondary"
        fullWidth
        leftIcon={<Calendar size={18} color={colors.text} />}
        onPress={() => setShowDate(true)}
        accessibilityLabel={`Date received: ${dateReceived}`}
        accessibilityHint="Opens date picker"
      >
        {dateReceived}
      </AppButton>

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
        <AppButton
          variant="tertiary"
          onPress={() => setShowDate(false)}
          containerStyle={{ alignSelf: 'flex-end' }}
          accessibilityLabel="Done picking date"
        >
          Done
        </AppButton>
      )}
    </AppCard>
  );
});
