import React from 'react';
import { Text, View } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { accentAlpha } from '../../theme';
import type { Repair } from '../../types/repair';
import { formatCurrency } from '../../utils/format';
import { AppCard } from '../../components/ui/AppCard';
import { AppChip } from '../../components/ui/AppChip';
import { createStyles } from './styles';

type Props = {
  repair: Repair;
  balance: number;
  onMarkAsPaid: () => void;
  colors: AppColors;
  cardColors?: string[];
};

export const PaymentCard = React.memo(function PaymentCard({
  repair,
  balance,
  onMarkAsPaid,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <AppCard variant="outlined" containerStyle={styles.sectionCard}>
      <View style={styles.listCardBody}>
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
              <AppChip
                variant="default"
                showSelectedCheck={false}
                icon={({ size }) => (
                  <CheckCircle2 size={size} color={colors.success} strokeWidth={2.4} />
                )}
                onPress={onMarkAsPaid}
                accessibilityLabel="Mark as Paid"
                containerStyle={{
                  backgroundColor: accentAlpha(colors.success, 0.12),
                  borderColor: accentAlpha(colors.success, 0.25),
                }}
                labelStyle={{ color: colors.success, fontWeight: '700' }}
              >
                Mark Paid
              </AppChip>
            )}
          </View>
        </View>
      </View>
    </AppCard>
  );
});
