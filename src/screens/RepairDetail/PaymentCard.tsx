import React from 'react';
import { Pressable, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { CheckCircle } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import type { Repair } from '../../types/repair';
import { formatCurrency } from '../../utils/format';
import { createStyles } from './styles';

type Props = {
  repair: Repair;
  balance: number;
  onMarkAsPaid: () => void;
  mode: 'light' | 'dark';
  colors: AppColors;
  cardColors: string[];
};

export const PaymentCard = React.memo(function PaymentCard({
  repair,
  balance,
  onMarkAsPaid,
  mode,
  colors,
  cardColors,
}: Props) {
  const styles = createStyles(colors, mode);

  return (
    <LinearGradient colors={cardColors} style={styles.paymentCard}>
      <View style={styles.paymentCardInner}>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Repair cost</Text>
          <Text style={styles.paymentValue}>{formatCurrency(repair.repairCost)}</Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Advance paid</Text>
          <Text style={[styles.paymentValue, styles.paymentValueGreen]}>
            {formatCurrency(repair.advanceAmount)}
          </Text>
        </View>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment method</Text>
          <Text style={styles.paymentValue}>
            {repair.paymentType === 'online' ? 'Online' : 'Cash'}
          </Text>
        </View>
        <View style={styles.paymentDivider} />
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Balance</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              style={[
                styles.paymentValue,
                repair.isPaid ? styles.paymentValueGreen : styles.paymentValueAccent,
              ]}
            >
              {repair.isPaid ? 'Paid \u2713' : formatCurrency(balance)}
            </Text>
            {!repair.isPaid && (
              <Pressable
                onPress={onMarkAsPaid}
                style={({ pressed }) => [{ padding: 4, marginLeft: 4 }, pressed && { opacity: 0.7 }]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <CheckCircle size={18} color={colors.success} strokeWidth={2.5} />
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </LinearGradient>
  );
});
