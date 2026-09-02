import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AppColors } from '../../theme';
import { styles } from './styles';

type Props = {
  subTab: 'dues' | 'paid';
  onTabChange?: (tab: 'dues' | 'paid') => void;
  onSubTabChange: (tab: 'dues' | 'paid') => void;
  duesCount: number;
  paidCount: number;
  colors: AppColors;
};

export const FinanceTabBar = React.memo(function FinanceTabBar({
  subTab,
  onSubTabChange,
  duesCount,
  paidCount,
  colors,
}: Props) {
  const isDues = subTab === 'dues';

  return (
    <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        onPress={() => onSubTabChange('dues')}
        style={[
          styles.tabBtn,
          {
            backgroundColor: isDues ? colors.surface2 : 'transparent',
            borderWidth: isDues ? 1 : 0,
            borderColor: isDues ? colors.border : 'transparent',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={[
              styles.tabText,
              {
                color: isDues ? colors.text : colors.textMuted,
                fontWeight: isDues ? '800' : '600',
              },
            ]}
          >
            Unpaid Dues
          </Text>
          <View
            style={{
              backgroundColor: isDues ? 'rgba(239, 68, 68, 0.15)' : colors.surface2,
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: isDues ? colors.danger : colors.textMuted,
              }}
            >
              {duesCount}
            </Text>
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={() => onSubTabChange('paid')}
        style={[
          styles.tabBtn,
          {
            backgroundColor: !isDues ? colors.surface2 : 'transparent',
            borderWidth: !isDues ? 1 : 0,
            borderColor: !isDues ? colors.border : 'transparent',
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text
            style={[
              styles.tabText,
              {
                color: !isDues ? colors.text : colors.textMuted,
                fontWeight: !isDues ? '800' : '600',
              },
            ]}
          >
            Fully Paid
          </Text>
          <View
            style={{
              backgroundColor: !isDues ? 'rgba(34, 197, 94, 0.15)' : colors.surface2,
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: !isDues ? colors.success : colors.textMuted,
              }}
            >
              {paidCount}
            </Text>
          </View>
        </View>
      </Pressable>
    </View>
  );
});

