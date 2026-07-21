import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { Phone, User } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import type { DirectoryCustomer } from '../../../types/customer';
import {
  normalizePhoneInput,
  normalizeStoredPhoneForDisplay,
  sanitizeCustomerNameInput,
} from '../../../utils/repairValidation';
import type { AddRepairStyles } from '../styles';

type Props = {
  customerName: string;
  phone: string;
  isEdit: boolean;
  directoryCustomers: DirectoryCustomer[];
  onChangeCustomerName: (name: string) => void;
  onChangePhone: (phone: string) => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const CustomerSection = React.memo(function CustomerSection({
  customerName,
  phone,
  isEdit,
  directoryCustomers,
  onChangeCustomerName,
  onChangePhone,
  styles,
  colors,
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const query = customerName.trim().toLowerCase();
  const matches =
    !isEdit && showSuggestions && query.length > 1
      ? directoryCustomers.filter(
          (c) => c.customerName.toLowerCase().includes(query) && c.customerName.toLowerCase() !== query
        )
      : [];

  return (
    <>
      <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>

      <View style={{ zIndex: 10 }}>
        <PaperInput
          label="Customer Name"
          placeholder="Enter customer name"
          value={customerName}
          onChangeText={(t) => {
            onChangeCustomerName(sanitizeCustomerNameInput(t));
            setShowSuggestions(true);
          }}
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
          style={styles.paperInput}
          left={<PaperInput.Icon icon={() => <User color={colors.accent} size={20} />} />}
          accessibilityLabel="Customer Name"
          accessibilityHint="Enter the customer's full name"
        />
        {matches.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {matches.slice(0, 3).map((c) => (
              <Pressable
                key={c.phone}
                style={styles.suggestionItem}
                android_ripple={{ color: colors.border }}
                onPress={() => {
                  onChangeCustomerName(sanitizeCustomerNameInput(c.customerName));
                  onChangePhone(normalizeStoredPhoneForDisplay(c.phone));
                  setShowSuggestions(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Select customer ${c.customerName}`}
              >
                <Text style={styles.suggestionName}>{c.customerName}</Text>
                <Text style={styles.suggestionPhone}>{c.phone}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <PaperInput
        label="Phone Number"
        placeholder="Enter phone number"
        value={phone}
        onChangeText={(t) => onChangePhone(normalizePhoneInput(t))}
        keyboardType="number-pad"
        maxLength={10}
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
        style={styles.paperInput}
        left={<PaperInput.Icon icon={() => <Phone color={colors.accent} size={20} />} />}
        accessibilityLabel="Phone Number"
        accessibilityHint="Enter 10-digit mobile number"
      />
    </>
  );
});
