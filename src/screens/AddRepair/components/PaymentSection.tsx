import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Switch as PaperSwitch, TextInput as PaperInput } from 'react-native-paper';
import { CreditCard, MessageSquare } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { accentAlpha } from '../../../theme';
import { formatCurrency } from '../../../utils/format';
import type { AddRepairStyles } from '../styles';

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
  paymentType,
  sendWhatsAppInvoice,
  isEdit,
  onChangeRepairCost,
  onChangeExpense,
  onChangeAdvanceAmount,
  onChangeIsPaid,
  onChangePaymentType,
  onChangeSendWhatsAppInvoice,
  styles,
  colors,
}: Props) {
  const costNum = Number(repairCost) || 0;
  const advNum = Number(advanceAmount) || 0;
  const dueAmount = Math.max(0, costNum - advNum);

  return (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <CreditCard size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Billing & Payment</Text>
        </View>
      </View>

      {/* Row 1: Cost & Advance side-by-side */}
      <View style={styles.billingRow}>
        <PaperInput
          label="Total Cost (₹)"
          placeholder="0"
          value={repairCost}
          onChangeText={onChangeRepairCost}
          keyboardType="decimal-pad"
          mode="outlined"
          dense={true}
          outlineColor={colors.border}
          activeOutlineColor={colors.accent}
          textColor={colors.text}
          placeholderTextColor={colors.textMuted}
          theme={{
            colors: {
              background: colors.surface2,
              placeholder: colors.textMuted,
            },
          }}
          style={[styles.paperInput, { flex: 1 }]}
          accessibilityLabel="Repair cost"
        />

        <PaperInput
          label="Advance Paid (₹)"
          placeholder="0"
          value={advanceAmount}
          onChangeText={onChangeAdvanceAmount}
          keyboardType="decimal-pad"
          mode="outlined"
          dense={true}
          outlineColor={colors.border}
          activeOutlineColor={colors.accent}
          textColor={colors.text}
          placeholderTextColor={colors.textMuted}
          theme={{
            colors: {
              background: colors.surface2,
              placeholder: colors.textMuted,
            },
          }}
          style={[styles.paperInput, { flex: 1 }]}
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

      {/* Payment Method Selector */}
      <Text style={styles.fieldLabel}>Payment Mode</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        {(['cash', 'online'] as const).map((method) => {
          const isSelected = paymentType === method;
          return (
            <Pressable
              key={method}
              onPress={() => onChangePaymentType(method)}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isSelected ? colors.accent : colors.border,
                backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              accessibilityRole="button"
              accessibilityLabel={`Payment method ${method}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  color: isSelected ? colors.accent : colors.textMuted,
                  fontSize: 12.5,
                  fontWeight: isSelected ? '700' : '600',
                }}
              >
                {method === 'cash' ? '💵 Cash' : '📱 Online / UPI'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* WhatsApp Invoice Toggle */}
      {!isEdit && (
        <Pressable
          onPress={() => onChangeSendWhatsAppInvoice(!sendWhatsAppInvoice)}
          style={styles.switchRow}
          android_ripple={{ color: colors.border }}
          accessibilityRole="switch"
          accessibilityLabel="Send WhatsApp invoice PDF after save"
          accessibilityState={{ checked: sendWhatsAppInvoice }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <MessageSquare size={16} color={colors.accent} />
            <Text style={styles.switchLabel}>Send invoice via WhatsApp after save</Text>
          </View>
          <PaperSwitch
            value={sendWhatsAppInvoice}
            onValueChange={onChangeSendWhatsAppInvoice}
            color={colors.accent}
          />
        </Pressable>
      )}
    </View>
  );
});

