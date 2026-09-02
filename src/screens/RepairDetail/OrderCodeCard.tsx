import React from 'react';
import { Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StatusBadge } from '../../components/StatusBadge';
import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { createStyles } from './styles';

type Props = {
  repair: Repair;
  statusLabel: string;
  mode: 'light' | 'dark';
  colors: AppColors;
};

export const OrderCodeCard = React.memo(function OrderCodeCard({
  repair,
  statusLabel,
  mode,
  colors,
}: Props) {
  const styles = createStyles(colors, mode);

  return (
    <LinearGradient
      colors={mode === 'dark' ? ['#1E1B4B', '#0F172A'] : ['#EA580C', '#C2410C']}
      style={styles.orderCard}
    >
      <View style={styles.orderCardInner}>
        <View style={styles.orderCodeRow}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.orderCode}>{repair.orderCode}</Text>
            <Text style={styles.orderId}>Record #{repair.id}</Text>
          </View>
          <StatusBadge status={repair.status} label={statusLabel} />
        </View>
      </View>
    </LinearGradient>
  );
});
