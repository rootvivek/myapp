import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Chip as PaperChip, Switch as PaperSwitch, TextInput as PaperInput } from 'react-native-paper';
import type { AppColors } from '../../../theme';
import { accentAlpha, spacing } from '../../../theme';
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
  return (
    <>
      <Text style={styles.sectionTitle}>PAYMENT</Text>
      <View style={styles.paymentCard}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <PaperInput
            label="Repair cost (₹)"
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
                background: colors.surface,
                placeholder: colors.textMuted,
              },
            }}
            style={[styles.paymentPaperInput, { flex: 1 }]}
            accessibilityLabel="Repair cost"
          />
          <PaperInput
            label="Expense (₹)"
            placeholder="0"
            value={expense}
            onChangeText={onChangeExpense}
            keyboardType="decimal-pad"
            mode="outlined"
            dense={true}
            outlineColor={colors.border}
            activeOutlineColor={colors.accent}
            textColor={colors.text}
            placeholderTextColor={colors.textMuted}
            theme={{
              colors: {
                background: colors.surface,
                placeholder: colors.textMuted,
              },
            }}
            style={[styles.paymentPaperInput, { flex: 1 }]}
            accessibilityLabel="Expense"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: spacing.md }}>
          <PaperInput
            label="Advance amount (₹)"
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
                background: colors.surface,
                placeholder: colors.textMuted,
              },
            }}
            style={[styles.paymentPaperInput, { flex: 1 }]}
            accessibilityLabel="Advance amount"
          />
        </View>

        {/* Payment Method Selector */}
        <Text style={[{ marginTop: spacing.md, color: colors.textMuted, fontSize: 13, fontWeight: '600' }]}>
          Payment Method
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 6, marginBottom: 4 }}>
          {(['cash', 'online'] as const).map((method) => {
            const isSelected = paymentType === method;
            return (
              <PaperChip
                key={method}
                selected={isSelected}
                onPress={() => onChangePaymentType(method)}
                style={{
                  backgroundColor: isSelected ? accentAlpha(colors.accent, 0.15) : colors.surface2,
                  borderColor: isSelected ? colors.accent : colors.border,
                  flex: 1,
                }}
                textStyle={{
                  color: isSelected ? colors.accent : colors.textMuted,
                  fontWeight: isSelected ? '700' : '600',
                  fontSize: 12,
                  textAlign: 'center',
                }}
                accessibilityRole="button"
                accessibilityLabel={`Payment method ${method}`}
                accessibilityState={{ selected: isSelected }}
              >
                {method === 'cash' ? 'Cash' : 'Online'}
              </PaperChip>
            );
          })}
        </View>

        {isEdit && (
          <Pressable
            onPress={() => onChangeIsPaid(!isPaid)}
            style={[styles.paidRow, { marginTop: 12 }]}
            android_ripple={{ color: colors.border }}
            accessibilityRole="switch"
            accessibilityLabel="Marked as paid"
            accessibilityState={{ checked: isPaid }}
          >
            <Text style={styles.paidLabel}>Marked as paid</Text>
            <PaperSwitch
              value={isPaid}
              onValueChange={onChangeIsPaid}
              color={colors.success}
            />
          </Pressable>
        )}
      </View>

      {!isEdit ? (
        <Pressable
          onPress={() => onChangeSendWhatsAppInvoice(!sendWhatsAppInvoice)}
          style={styles.whatsappCard}
          android_ripple={{ color: colors.border }}
          accessibilityRole="switch"
          accessibilityLabel="Send WhatsApp invoice PDF after save"
          accessibilityState={{ checked: sendWhatsAppInvoice }}
        >
          <Text style={styles.whatsappLabel}>Send WhatsApp invoice PDF after save</Text>
          <PaperSwitch
            value={sendWhatsAppInvoice}
            onValueChange={onChangeSendWhatsAppInvoice}
            color={colors.accent}
          />
        </Pressable>
      ) : null}
    </>
  );
});
