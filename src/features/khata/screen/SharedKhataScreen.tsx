import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../../../context/ThemeContext';
import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/ui/AppInput';
import { EmptyState } from '../components/EmptyState';
import { formatPaise } from '../utils/ledger';
import * as khataService from '../services/khataService';
import type { SharedKhataLedger } from '../services/khataService';
import { supabase } from '../../../lib/supabase';
import { claimVerifiedPhone, normalizePhone, sendOtp, verifyOtp } from '../../../services/msg91Service';

function ledgerBalance(ledger: SharedKhataLedger): number {
  return ledger.transactions.reduce((balance, transaction) => balance + Number(transaction.balance_delta_paise), 0);
}

export function SharedKhataScreen() {
  const { colors } = useTheme();
  const [ledgers, setLedgers] = useState<SharedKhataLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [matchRequests, setMatchRequests] = useState<khataService.PhoneMatchRequest[]>([]);
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLedgers(await khataService.listSharedLedgers());
      setMatchRequests(await khataService.listPhoneMatchRequests());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load shared ledgers.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const respondToMatch = useCallback(async (linkId: string, accept: boolean) => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await khataService.respondToPhoneMatch(linkId, accept);
      setMessage(accept ? 'Matched ledger accepted.' : 'Matched ledger declined.');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not process matched ledger.');
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const verifyPhoneForMatching = useCallback(async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!phoneOtpSent) {
        const result = await sendOtp(normalizePhone(phone));
        if (!result.ok) throw new Error(result.message);
        setPhoneOtpSent(true);
        setMessage('OTP sent. Enter it to verify your phone and find matching ledgers.');
        return;
      }
      const result = await verifyOtp(phoneOtp);
      if (!result.ok) throw new Error(result.message);
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) throw new Error('Sign in again to verify your phone.');
      await claimVerifiedPhone(data.session.access_token, normalizePhone(phone));
      setPhoneOtp('');
      setPhoneOtpSent(false);
      setMessage('Phone verified. Any unique phone matches will appear for your review.');
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Phone verification failed.');
    } finally {
      setBusy(false);
    }
  }, [phone, phoneOtp, phoneOtpSent, refresh]);

  const cards = useMemo(() => ledgers.map((ledger) => {
    // Ledger deltas follow the shop's perspective; invert for the client view.
    const balance = -ledgerBalance(ledger);
    return { ledger, balance, clientDirection: balance > 0 ? 'You owe this shop' : balance < 0 ? 'This shop owes you' : 'Settled' };
  }), [ledgers]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16 }}>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 6 }}>Shared Khata</Text>
      <Text style={{ color: colors.textMuted, marginBottom: 12 }}>Verify your phone to find ledgers associated with your number. Nothing is shared until you accept a match.</Text>
      <View style={{ padding: 12, marginBottom: 12, borderRadius: 12, backgroundColor: colors.surface2 }}>
        <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 6 }}>Find a ledger by verified phone</Text>
        <Text style={{ color: colors.textMuted, marginBottom: 8 }}>Verify the number a shop may have saved for you. Matches stay pending until you accept.</Text>
        <AppInput label="Your phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        {phoneOtpSent ? <AppInput label="OTP" value={phoneOtp} onChangeText={setPhoneOtp} keyboardType="number-pad" /> : null}
        <AppButton variant="secondary" onPress={() => void verifyPhoneForMatching()} loading={busy} disabled={busy || !phone.trim() || (phoneOtpSent && !phoneOtp.trim())}>
          {phoneOtpSent ? 'Verify phone' : 'Send verification code'}
        </AppButton>
      </View>
      <AppButton variant="secondary" onPress={() => void refresh()} disabled={loading} style={{ marginBottom: 12 }}>Refresh ledgers</AppButton>
      {matchRequests.length > 0 ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 8 }}>Phone matches to review</Text>
          {matchRequests.map((request) => (
            <View key={request.link_id} style={{ padding: 12, marginBottom: 8, borderRadius: 12, backgroundColor: colors.surface2 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{request.shop_name}</Text>
              <Text style={{ color: colors.textMuted, marginTop: 2 }}>Ledger for {request.party_name}. Review and accept to share; no data is visible before acceptance.</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                <AppButton variant="primary" onPress={() => void respondToMatch(request.link_id, true)} loading={busy} disabled={busy} style={{ flex: 1 }}>Accept</AppButton>
                <AppButton variant="secondary" onPress={() => void respondToMatch(request.link_id, false)} disabled={busy} style={{ flex: 1 }}>Decline</AppButton>
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {message ? <Text style={{ color: colors.success, marginBottom: 8 }}>{message}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginBottom: 8 }}>{error}</Text> : null}
      {loading ? <ActivityIndicator color={colors.accent} /> : cards.length === 0 ? (
        <EmptyState title="No shared ledgers" description="Verify the phone number your shop has on file. Any matching ledger will appear here for your review." />
      ) : (
        <FlatList
          data={cards}
          keyExtractor={({ ledger }) => ledger.link_id}
          renderItem={({ item: { ledger, balance, clientDirection } }) => (
            <View style={{ padding: 14, marginBottom: 10, borderRadius: 12, backgroundColor: colors.surface2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, flex: 1 }} numberOfLines={1}>
                  {ledger.party_name}
                </Text>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
                  {formatPaise(Math.abs(balance))}
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, marginTop: 3 }}>{ledger.shop_name} · {clientDirection}</Text>
              {ledger.transactions.map((transaction) => (
                <View key={transaction.id} style={{ paddingVertical: 9, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8 }}>
                  <Text style={{ color: colors.text, fontWeight: '600' }}>{transaction.transaction_type.replace('_', ' ')}</Text>
                  <Text style={{ color: colors.textMuted }}>{formatPaise(Number(transaction.amount_paise))} · {transaction.transaction_date}</Text>
                  {transaction.correction_ref_id ? <Text style={{ color: colors.textMuted }}>Corrects a previous entry</Text> : null}
                </View>
              ))}
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}