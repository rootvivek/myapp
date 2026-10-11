import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Switch as PaperSwitch } from 'react-native-paper';
import { MessageSquare } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { FormTextInput } from '../../../components/FormTextInput';
import { formatCurrency } from '../../../utils/format';
import type { AddRepairStyles } from '../styles';
import { AppCard } from '../../../components/ui/AppCard';

type Props = {
  repairCost: string;
  expense: string;
  advanceAmount: string;
  isPaid: boolean;
  paymentType: 'cash' | 'online';
  sendWhatsAppInvoice: boolean;
  isEdit: boolean;
  onChangeRepairCost: (val: string) => void;
  onChangeExpense: (val: string) => void;
  onChangeAdvanceAmount: (val: string) => void;
  onChangeIsPaid: (val: boolean) => void;
  onChangePaymentType: (type: 'cash' | 'online') => void;
  onChangeSendWhatsAppInvoice: (val: boolean) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const PaymentSection = React.memo(function PaymentSection({
  repairCost,
  expense,
  advanceAmount,
  isPaid,
  sendWhatsAppInvoice,
  isEdit,
  onChangeRepairCost,
  onChangeExpense,
  onChangeAdvanceAmount,
  onChangeSendWhatsAppInvoice,
  styles,
  colors,
}: Props) {
  const costNum = Number(repairCost) || 0;
  const advNum = Number(advanceAmount) || 0;
  const dueAmount = Math.max(0, costNum - advNum);

  return (
    <AppCard>
      <Text style={styles.fieldLabel}>Billing & Payment</Text>

      {/* Keep all three billing amounts together on one row. */}
      <View style={styles.billingRow}>
        <FormTextInput
          label="Total Cost (₹)"
          placeholder="0"
          value={repairCost}
          onChangeText={onChangeRepairCost}
          keyboardType="decimal-pad"
          containerStyle={styles.inputFlex}
          accessibilityLabel="Repair cost"
        />

        <FormTextInput
          label="Expense (₹)"
          placeholder="0"
          value={expense}
          onChangeText={onChangeExpense}
          keyboardType="decimal-pad"
          containerStyle={styles.inputFlex}
          accessibilityLabel="Expense amount"
        />

        <FormTextInput
          label="Advance Paid (₹)"
          placeholder="0"
          value={advanceAmount}
          onChangeText={onChangeAdvanceAmount}
          keyboardType="decimal-pad"
          containerStyle={styles.inputFlex}
          accessibilityLabel="Advance amount"
        />
      </View>

      {/* Live Balance / Due Pill */}
      <View style={styles.balancePreviewRow}>
        <Text style={styles.balanceLabel}>Remaining Balance Due</Text>
        <Text
          style={[
            styles.balanceValue,
            { color: isPaid || dueAmount === 0 ? colors.success : colors.warning },
          ]}
        >
          {isPaid || (costNum > 0 && dueAmount === 0)
            ? 'Fully Paid ✓'
            : formatCurrency(dueAmount)}
        </Text>
      </View>

      {/* WhatsApp Invoice Toggle */}
      {!isEdit && (
        <Pressable
          onPress={() => onChangeSendWhatsAppInvoice(!sendWhatsAppInvoice)}
          style={styles.switchRow}
          accessibilityRole="switch"
          accessibilityLabel="Send WhatsApp invoice PDF after save"
          accessibilityState={{ checked: sendWhatsAppInvoice }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <MessageSquare size={15} color={colors.accent} strokeWidth={2} />
            <Text style={styles.switchLabel}>Send invoice via WhatsApp after save</Text>
          </View>
          <PaperSwitch
            value={sendWhatsAppInvoice}
            onValueChange={onChangeSendWhatsAppInvoice}
            color={colors.accent}
          />
        </Pressable>
      )}
    </AppCard>
  );
});
