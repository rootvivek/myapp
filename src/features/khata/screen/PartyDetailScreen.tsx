import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';

import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/ui/AppInput';
import { AppModal } from '../../../components/ui/AppModal';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { useAuth } from '../../../context/AuthContext';

import { useKhata } from '../hooks/useKhata';
import { createTransaction, listTransactions } from '../services/khataService';
import { TransactionBubble } from '../components/TransactionBubble';
import { EmptyState } from '../components/EmptyState';
import { formatPaise, getPartyTypeLabel, parseAmountStr, validateAmount } from '../utils/ledger';
import type { KhataTransaction } from '../types';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { KhataParamList as KhataRoutes } from '../navigation/types';

type Props = NativeStackScreenProps<KhataRoutes, 'PartyDetail'>;

export function PartyDetailScreen({ route }: Props) {
  const { colors } = useTheme();
  const { session, profile } = useAuth();
  const historyScope = `${session?.user?.id ?? ''}:${profile?.shopId ?? ''}`;
  const { partyId } = route.params;

  const { parties, loading, refresh } = useKhata();
  const [transactions, setTransactions] = useState<KhataTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [addTransactionVisible, setAddTransactionVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingType, setSavingType] = useState<'payment_given' | 'payment_received' | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const transactionsCacheRef = useRef(new Map<string, KhataTransaction[]>());
  const historyCacheKey = `${historyScope}:${partyId}`;
  const party = parties.find((item) => item.id === partyId);

  useEffect(() => {
    requestIdRef.current += 1;
    setTransactions([]);
    setTransactionsLoading(false);
    setTransactionError(null);
  }, [historyScope, partyId]);

  const loadTransactions = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const requestScope = historyScope;
    const cached = transactionsCacheRef.current.get(historyCacheKey);
    if (cached) setTransactions(cached);
    else setTransactionsLoading(true);
    setTransactionError(null);
    try {
      const items = await listTransactions(partyId, { limit: 100, offset: 0 });
      if (requestId === requestIdRef.current && requestScope === historyScope) {
        const ordered = items.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate) || b.createdAt.localeCompare(a.createdAt));
        transactionsCacheRef.current.set(historyCacheKey, ordered);
        setTransactions(ordered);
      }
    } catch (error: unknown) {
      if (requestId === requestIdRef.current && requestScope === historyScope) {
        setTransactionError(error instanceof Error ? error.message : 'Could not load transactions.');
      }
    } finally {
      if (requestId === requestIdRef.current && requestScope === historyScope) setTransactionsLoading(false);
    }
  }, [historyCacheKey, historyScope, partyId]);

  useFocusEffect(useCallback(() => {
    void refresh();
    void loadTransactions();
    return () => { requestIdRef.current += 1; };
  }, [loadTransactions, refresh]));

  const renderItem = useCallback(({ item }: { item: KhataTransaction }) => (
    <TransactionBubble transaction={item} />
  ), []);

  const closeAddTransaction = useCallback(() => {
    if (saving) return;
    setAddTransactionVisible(false);
    setSaveError(null);
  }, [saving]);

  const saveTransaction = useCallback(async (transactionType: 'payment_given' | 'payment_received') => {
    setSaveError(null);
    if (!amount.trim()) {
      setSaveError('Enter an amount.');
      return;
    }

    setSaving(true);
    setSavingType(transactionType);
    try {
      const amountPaise = Math.round(parseAmountStr(amount, 'transaction') * 100);
      validateAmount(amountPaise, 'transaction');
      await createTransaction({
        partyId,
        transactionType,
        amountPaise,
        transactionDate: new Date().toISOString().slice(0, 10),
        note: note.trim().slice(0, 2000),
      });
      setAddTransactionVisible(false);
      setAmount('');
      setNote('');
      await Promise.all([loadTransactions(), refresh()]);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : 'Could not save transaction.');
    } finally {
      setSaving(false);
      setSavingType(null);
    }
  }, [amount, loadTransactions, note, partyId, refresh]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.surface2,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.accent }}>{party?.name?.[0] ?? 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }} numberOfLines={1}>
              {party?.name ?? 'Party'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.textMuted }}>{getPartyTypeLabel(party?.partyType)}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
            <Text style={{ fontSize: 11, color: colors.textMuted }}>Current Balance</Text>
            <Text style={{ fontSize: 20, fontWeight: '900', color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>
            {party?.balancePaise !== undefined ? formatPaise(party.balancePaise) : '₹0.00'}
            </Text>
            <Text style={{ fontSize: 10, color: colors.textMuted }}>
              {party?.balancePaise !== undefined && party.balancePaise > 0 ? "You'll Give" : party?.balancePaise !== undefined && party.balancePaise < 0 ? "You'll Get" : 'Settled'}
            </Text>
          </View>
        </View>
      </View>

      {/* Transaction history */}
      <View style={{ flex: 1 }}>
        {((loading && !party) || (transactionsLoading && transactions.length === 0)) ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading transactions...</Text>
          </View>
        ) : transactionError ? (
          <EmptyState title="Couldn't refresh transactions" description={transactions.length ? `Showing saved transactions. ${transactionError}` : transactionError} />
        ) : party && transactions.length === 0 ? (
          <EmptyState
            title="No transactions"
            description="Record the first transaction to start your ledger."
          />
        ) : null}
        {!loading && party && transactions.length > 0 ? (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 24, flexGrow: 1 }}
            inverted
            keyboardShouldPersistTaps="handled"
          />
        ) : null}
      </View>

      <View style={{ padding: 12, backgroundColor: colors.surface2 }}>
        <AppButton
          variant="primary"
          fullWidth
          onPress={() => {
            setAmount('');
            setNote('');
            setSaveError(null);
            setAddTransactionVisible(true);
          }}
        >
          Add Transaction
        </AppButton>
      </View>

      <AppModal
        visible={addTransactionVisible}
        onClose={closeAddTransaction}
        title="Add transaction"
        subtitle={party?.name}
        closeOnOverlayPress={!saving}
        footer={(
          <>
            <AppButton
              variant="secondary"
              style={{ flex: 1 }}
              onPress={() => void saveTransaction('payment_given')}
              loading={savingType === 'payment_given'}
              disabled={saving}
            >
              {savingType === 'payment_given' ? 'Processing...' : 'Given'}
            </AppButton>
            <AppButton
              variant="primary"
              style={{ flex: 1 }}
              onPress={() => void saveTransaction('payment_received')}
              loading={savingType === 'payment_received'}
              disabled={saving}
            >
              {savingType === 'payment_received' ? 'Processing...' : 'Received'}
            </AppButton>
          </>
        )}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <AppInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            keyboardType="decimal-pad"
            error={saveError || undefined}
            containerStyle={{ marginBottom: 12 }}
          />
          <AppInput
            label="Note (optional)"
            value={note}
            onChangeText={setNote}
            placeholder="Add a note"
            multiline
            containerStyle={{ marginBottom: 0 }}
          />
        </KeyboardAvoidingView>
      </AppModal>

    </View>
  );
}
