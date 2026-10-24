import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/ui/AppInput';
import { useTheme } from '../../../context/ThemeContext';

import * as khataService from '../services/khataService';
import { useKhataRouter } from '../hooks/useKhataRouter';
import { isValidKhataDate, parseAmountStr, validateAmount } from '../utils/ledger';
type PaymentTransactionType = 'payment_given' | 'payment_received';

export function AddTransactionScreen({ route }: { route: { params: { partyId: string; partyName: string } } }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useKhataRouter();

  const { partyId, partyName } = route.params;

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(async (transactionType: PaymentTransactionType) => {
    setError(null);
    if (!amount.trim()) { setError('Amount is required.'); return; }
    if (!isValidKhataDate(date)) { setError('Enter a real date in YYYY-MM-DD format.'); return; }
    setSaving(true);
    try {
      const amountPaise = Math.round(parseAmountStr(amount, 'transaction') * 100);
      validateAmount(amountPaise, 'transaction');
      await khataService.createTransaction({
        partyId,
        transactionType,
        amountPaise,
        transactionDate: date,
        note: note.trim().slice(0, 2000),
      });
      router.goBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add transaction.');
    } finally {
      setSaving(false);
    }
  }, [amount, date, note, partyId, router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 24 }}>
        New Transaction
      </Text>

      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Party</Text>
      <View style={{ padding: 12, backgroundColor: colors.surface, borderRadius: 12, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{partyName}</Text>
      </View>

      <AppInput
        label="Amount"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
        keyboardType="decimal-pad"
        error={error || undefined}
        containerStyle={{ marginBottom: 16 }}
      />

      <AppInput
        label="Transaction Date"
        value={date}
        onChangeText={setDate}
        placeholder="YYYY-MM-DD"
        keyboardType="default"
        containerStyle={{ marginBottom: 16 }}
      />

      <AppInput
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="Add any additional details..."
        multiline
        containerStyle={{ marginBottom: 20 }}
      />

      </ScrollView>
      <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 4, paddingTop: 10, paddingBottom: insets.bottom + 10, backgroundColor: colors.bg }}>
        <AppButton
          variant="secondary"
          style={{ flex: 1 }}
          onPress={() => void handleSave('payment_given')}
          loading={saving}
          disabled={saving}
        >
          Payment Given
        </AppButton>
        <AppButton
          variant="primary"
          style={{ flex: 1 }}
          onPress={() => void handleSave('payment_received')}
          loading={saving}
          disabled={saving}
        >
          Payment Received
        </AppButton>
      </View>
    </View>
  );
}
