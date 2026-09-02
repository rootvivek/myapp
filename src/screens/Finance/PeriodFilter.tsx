import React from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { AppColors } from '../../theme';
import { styles } from './styles';

export type FinancePeriod = 'today' | 'week' | 'month' | 'all' | 'custom';

type Props = {
  period: FinancePeriod;
  onPeriodChange: (p: FinancePeriod) => void;
  customStartDate: Date;
  customEndDate: Date;
  showStartDatePicker: boolean;
  showEndDatePicker: boolean;
  setShowStartDatePicker: (show: boolean) => void;
  setShowEndDatePicker: (show: boolean) => void;
  onStartDateChange: (event: DateTimePickerEvent, date?: Date) => void;
  onEndDateChange: (event: DateTimePickerEvent, date?: Date) => void;
  colors: AppColors;
};

const PERIOD_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom' },
] as const;

export const PeriodFilter = React.memo(function PeriodFilter({
  period,
  onPeriodChange,
  customStartDate,
  customEndDate,
  showStartDatePicker,
  showEndDatePicker,
  setShowStartDatePicker,
  setShowEndDatePicker,
  onStartDateChange,
  onEndDateChange,
  colors,
}: Props) {
  return (
    <>
      <View style={styles.periodContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodScrollContent}
          style={styles.periodScroll}
        >
          {PERIOD_OPTIONS.map((p) => {
            const active = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => onPeriodChange(p.key)}
                style={[
                  styles.periodBtn,
                  { borderColor: colors.border, backgroundColor: colors.surface2 },
                  active && { backgroundColor: colors.accent, borderColor: colors.accent },
                ]}
              >
                <Text
                  style={[
                    styles.periodText,
                    { color: active ? '#FFFFFF' : colors.textMuted },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {period === 'custom' && (
        <View style={styles.customDateContainer}>
          <Pressable
            onPress={() => setShowStartDatePicker(true)}
            style={[styles.customDateBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.border }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>FROM DATE</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
              {customStartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setShowEndDatePicker(true)}
            style={[styles.customDateBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            android_ripple={{ color: colors.border }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>TO DATE</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginTop: 2 }}>
              {customEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </Pressable>
        </View>
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={customStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={customEndDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onEndDateChange}
        />
      )}
    </>
  );
});
