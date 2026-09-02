import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AppColors } from '../../theme';
import { styles } from './styles';

type Props = {
  subTab: 'dues' | 'paid';
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
  return (
    <View style={styles.tabContainer}>
      <Pressable
        onPress={() => onSubTabChange('dues')}
        style={[
          styles.tabBtn,
          {
            backgroundColor: subTab === 'dues' ? colors.surface2 : 'transparent',
            borderColor: subTab === 'dues' ? colors.border : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: subTab === 'dues' ? colors.text : colors.textMuted,
              fontWeight: subTab === 'dues' ? '700' : '500',
            },
          ]}
        >
          Unpaid Jobs ({duesCount})
        </Text>
      </Pressable>
      <Pressable
        onPress={() => onSubTabChange('paid')}
        style={[
          styles.tabBtn,
          {
            backgroundColor: subTab === 'paid' ? colors.surface2 : 'transparent',
            borderColor: subTab === 'paid' ? colors.border : 'transparent',
          },
        ]}
      >
        <Text
          style={[
            styles.tabText,
            {
              color: subTab === 'paid' ? colors.text : colors.textMuted,
              fontWeight: subTab === 'paid' ? '700' : '500',
            },
          ]}
        >
          Fully Paid ({paidCount})
        </Text>
      </Pressable>
    </View>
  );
});
