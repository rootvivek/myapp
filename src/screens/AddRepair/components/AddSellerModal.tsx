/**
 * AddSellerModal — inline "Add New Seller" sheet shown within the New Job flow.
 * Uses AppModal (React Native Paper Modal) and AppInput.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, Text, View } from 'react-native';
import { sellerService } from '../../../services/sellerService';
import { FormTextInput } from '../../../components/FormTextInput';
import type { AppColors } from '../../../theme';
import { spacing } from '../../../theme';
import type { Seller } from '../../../types/seller';
import { AppModal } from '../../../components/ui/AppModal';
import { AppButton } from '../../../components/ui/AppButton';

type Props = {
  visible: boolean;
  colors: AppColors;
  onClose: () => void;
  /** Called with the newly created (or pre-existing) seller after save. */
  onSaved: (seller: Seller) => void;
};

export const AddSellerModal = React.memo(function AddSellerModal({
  visible,
  colors,
  onClose,
  onSaved,
}: Props) {
  const [sellerName, setSellerName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [nameError, setNameError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const reset = useCallback(() => {
    setSellerName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setNameError('');
    setSaving(false);
    savingRef.current = false;
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleSave = useCallback(async () => {
    if (savingRef.current) return;

    const trimmedName = sellerName.trim();
    if (!trimmedName) {
      setNameError('Seller name is required.');
      return;
    }
    if (trimmedName.length > 100) {
      setNameError('Seller name must be 100 characters or fewer.');
      return;
    }

    savingRef.current = true;
    setSaving(true);
    Keyboard.dismiss();

    try {
      const created = await sellerService.create({
        sellerName: trimmedName,
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
      });
      reset();
      onSaved(created);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not save seller.';
      Alert.alert('Error', msg);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [sellerName, phone, address, notes, onSaved, reset]);

  const localStyles = StyleSheet.create({
    body: {
      padding: spacing.lg,
      gap: spacing.xs,
    },
    requiredDot: {
      color: colors.danger,
    },
  });

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      title="Add New Seller"
      subtitle="Seller details are saved for future jobs."
      size="medium"
      showCloseButton={true}
    >
      <View style={localStyles.body}>
        <FormTextInput
          label={
            <Text>
              Seller Name <Text style={localStyles.requiredDot}>*</Text>
            </Text>
          }
          placeholder="e.g. ABC Mobile"
          value={sellerName}
          onChangeText={(v) => {
            setSellerName(v);
            if (nameError) setNameError('');
          }}
          error={nameError}
          maxLength={100}
          autoCapitalize="words"
          returnKeyType="next"
          accessibilityLabel="Seller name"
          containerStyle={{ marginBottom: 2 }}
        />
        <FormTextInput
          label="Phone (optional)"
          placeholder="e.g. 9876543210"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={15}
          returnKeyType="next"
          accessibilityLabel="Seller phone"
          containerStyle={{ marginBottom: 2 }}
        />
        <FormTextInput
          label="Address (optional)"
          placeholder="e.g. Shop 12, Nehru Market"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="sentences"
          maxLength={200}
          returnKeyType="next"
          accessibilityLabel="Seller address"
          containerStyle={{ marginBottom: 2 }}
        />
        <FormTextInput
          label="Notes (optional)"
          placeholder="e.g. Good for Samsung parts"
          value={notes}
          onChangeText={setNotes}
          autoCapitalize="sentences"
          maxLength={300}
          returnKeyType="done"
          onSubmitEditing={handleSave}
          accessibilityLabel="Seller notes"
          containerStyle={{ marginBottom: 2 }}
        />

        <AppButton
          variant="primary"
          fullWidth
          loading={saving}
          onPress={handleSave}
          accessibilityLabel="Save seller"
          style={{ marginTop: spacing.sm }}
        >
          {saving ? 'Saving…' : 'Save Seller'}
        </AppButton>

        <AppButton
          variant="outline"
          fullWidth
          onPress={handleClose}
          accessibilityLabel="Cancel add seller"
        >
          Cancel
        </AppButton>
      </View>
    </AppModal>
  );
});