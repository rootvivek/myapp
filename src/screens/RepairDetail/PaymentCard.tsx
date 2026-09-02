import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
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
  cardColors?: string[];
};

export const PaymentCard = React.memo(function PaymentCard({
  repair,
  balance,
  onMarkAsPaid,
  mode,
  colors,
}: Props) {
  const styles = createStyles(colors, mode);

  return (
    <View style={styles.card}>
      <View style={styles.cardInner}>
        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Total Repair Cost</Text>
          <Text style={styles.paymentValue}>{formatCurrency(repair.repairCost)}</Text>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Advance Paid</Text>
          <Text style={[styles.paymentValue, styles.paymentValueGreen]}>
            {formatCurrency(repair.advanceAmount)}
          </Text>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentLabel}>Payment Method</Text>
          <Text style={styles.paymentValue}>
            {repair.paymentType === 'online' ? 'Online' : 'Cash'}
          </Text>
        </View>

        <View style={styles.paymentDivider} />

        <View style={styles.paymentRow}>
          <Text style={[styles.paymentLabel, { fontWeight: '700', color: colors.text }]}>
            Balance Due
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              style={[
                styles.paymentValue,
                { fontSize: 16 },
                repair.isPaid ? styles.paymentValueGreen : styles.paymentValueAccent,
              ]}
            >
              {repair.isPaid ? 'Paid \u2713' : formatCurrency(balance)}
            </Text>

            {!repair.isPaid && (
              <Pressable
                onPress={onMarkAsPaid}
                style={({ pressed }) => [{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  backgroundColor: 'rgba(34, 197, 94, 0.12)',
                  gap: 4,
                }, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
                accessibilityLabel="Mark as Paid"
              >
                <CheckCircle2 size={15} color={colors.success} strokeWidth={2.4} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                  Mark Paid
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

