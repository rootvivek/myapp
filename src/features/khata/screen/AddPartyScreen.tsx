import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';

import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/ui/AppInput';
import { useTheme } from '../../../context/ThemeContext';

import { useKhataRouter } from '../hooks/useKhataRouter';
import type { PartyType } from '../types';
import * as khataService from '../services/khataService';
import { useKhata } from '../hooks/useKhata';

const CATEGORY_OPTIONS = [
  { key: 'seller' as const, label: 'Seller' },
  { key: 'dealer' as const, label: 'Dealer' },
  { key: 'supplier' as const, label: 'Supplier' },
  { key: 'customer' as const, label: 'Customer' },
  { key: 'other' as const, label: 'Other' },
] as const;

export function AddPartyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useKhataRouter();
  const { refresh } = useKhata();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [partyType, setPartyType] = useState<PartyType>(CATEGORY_OPTIONS[0].key);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; form?: string }>({});

  const handleSave = useCallback(async () => {
    setErrors({});
    if (name.trim().length < 2) {
      setErrors({ name: 'Party name must be at least 2 characters.' });
      return;
    }
    if (phone.replace(/\D/g, '').length < 7) {
      setErrors({ phone: 'Enter a valid phone number (at least 7 digits).' });
      return;
    }
    if (!partyType) {
      setErrors({ form: 'Please select a category.' });
      return;
    }
    setSaving(true);
    try {
      await khataService.createParty({ name: name.trim(), phone: phone.trim(), partyType, notes: '' });
      await refresh(true);
      router.goBack();
    } catch (err: unknown) {
      const message = err instanceof Error && /khata_parties|relation .* does not exist|schema cache/i.test(err.message)
        ? 'Khata setup is incomplete for this project. Apply the pending Supabase Khata migration and try again.'
        : err instanceof Error && /row-level security|permission denied|not authorized/i.test(err.message)
          ? 'You do not have permission to add this party. Please sign in again or contact the shop owner.'
          : err instanceof Error
            ? err.message
            : 'Failed to add party.';
      setErrors({ form: message });
    } finally {
      setSaving(false);
    }
  }, [name, phone, partyType, router, refresh]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <AppButton
          variant="secondary"
          compact
          onPress={() => router.goBack()}
          leftIcon={<ArrowLeft size={16} color={colors.textMuted} />}
        >
          Back
        </AppButton>
      </View>

      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 20, marginBottom: 24 }}>
        Add Party
      </Text>

      <AppInput
        label="Party Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g. Rahul Mobile Distributors"
        error={errors.name}
        containerStyle={{ marginBottom: 16 }}
      />

      <AppInput
        label="Phone Number"
        value={phone}
        onChangeText={setPhone}
        placeholder="98765 43210"
        keyboardType="numeric"
        error={errors.phone}
        containerStyle={{ marginBottom: 16 }}
      />

      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 }}>Category</Text>
      <View style={{ gap: 8 }}>
        {CATEGORY_OPTIONS.map((opt) => (
          <AppButton
            key={opt.key}
            variant={partyType === opt.key ? 'primary' : 'secondary'}
            fullWidth
            onPress={() => setPartyType(opt.key)}
            style={{ marginBottom: 6 }}
          >
            {opt.label}
          </AppButton>
        ))}
      </View>

      {errors.form ? (
        <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: 12, marginBottom: 12 }}>
          {errors.form}
        </Text>
      ) : null}

      <AppButton variant="primary" fullWidth onPress={handleSave} loading={saving}>
        Save Party
      </AppButton>
    </ScrollView>
  );
}
