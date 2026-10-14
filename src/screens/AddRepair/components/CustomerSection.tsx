import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppColors } from '../../../theme';
import { radius, sizes } from '../../../theme';
import { FormTextInput } from '../../../components/FormTextInput';
import type { DirectoryCustomer } from '../../../types/customer';
import {
  normalizePhoneInput,
  normalizeStoredPhoneForDisplay,
  sanitizeCustomerNameInput,
  type RepairFormErrors,
} from '../../../utils/repairValidation';
import type { AddRepairStyles } from '../styles';
import { AppButton } from '../../../components/ui/AppButton';
import { AppCard } from '../../../components/ui/AppCard';

type Props = {
  customerName: string;
  phone: string;
  isEdit: boolean;
  directoryCustomers: DirectoryCustomer[];
  errors?: RepairFormErrors;
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
  errors,
  onChangeCustomerName,
  onChangePhone,
  styles,
  colors,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [selectedExisting, setSelectedExisting] = useState(false);

  const nameError = errors?.customerName;
  const phoneError = errors?.phone;

  useEffect(() => {
    if (isEdit || selectedExisting) return;
    if (nameError || phoneError) setIsNewCustomerMode(true);
  }, [isEdit, selectedExisting, nameError, phoneError]);

  const query = searchQuery.trim().toLowerCase();
  const matches =
    !isEdit && showSuggestions && query.length > 0
      ? directoryCustomers.filter(
          (c) =>
            c.customerName.toLowerCase().includes(query) ||
            c.phone.includes(query)
        )
      : [];

  const handleSelectCustomer = (c: DirectoryCustomer) => {
    onChangeCustomerName(sanitizeCustomerNameInput(c.customerName));
    onChangePhone(normalizeStoredPhoneForDisplay(c.phone));
    setSearchQuery(c.customerName);
    setShowSuggestions(false);
    setSelectedExisting(true);
    setIsNewCustomerMode(false);
  };

  const handleToggleNewCustomer = () => {
    setIsNewCustomerMode(true);
    setSelectedExisting(false);
    setSearchQuery('');
    onChangeCustomerName('');
    onChangePhone('');
    setShowSuggestions(false);
  };

  const handleClearSelection = () => {
    setSelectedExisting(false);
    setIsNewCustomerMode(false);
    setSearchQuery('');
    onChangeCustomerName('');
    onChangePhone('');
  };

  return (
    <AppCard>
      {/* Mode 1: Search Customer */}
      {!isEdit && !isNewCustomerMode && !selectedExisting && (
        <View>
          <FormTextInput
            label="Customer"
            rightAction={{
              label: 'Add New',
              onPress: handleToggleNewCustomer,
              accessibilityLabel: 'Add new customer',
            }}
            placeholder="Search customer (Name or Phone)"
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            containerStyle={styles.inputTight}
            accessibilityLabel="Search customer"
          />

          {matches.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {matches.slice(0, 4).map((c) => (
                <Pressable
                  key={c.phone}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectCustomer(c)}
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
      )}

      {/* Selected Existing Customer */}
      {!isEdit && selectedExisting && (
        <View>
          <Text style={styles.fieldLabel}>Customer</Text>
          <View
            style={[
              localStyles.selectedCard,
              {
                backgroundColor: colors.surface2,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={localStyles.selectedInfo}>
              <Text style={[localStyles.selectedName, { color: colors.text }]}>
                {customerName}
              </Text>
              <Text style={[localStyles.selectedPhone, { color: colors.textMuted }]}>
                {phone}
              </Text>
            </View>
            <AppButton
              variant="tertiary"
              onPress={handleClearSelection}
              accessibilityLabel="Change customer"
            >
              Change
            </AppButton>
          </View>
        </View>
      )}

      {/* Mode 2: Manual Customer Name and Phone */}
      {(isEdit || isNewCustomerMode) && (
        <View>
          <FormTextInput
            label="Customer Name"
            rightAction={
              !isEdit
                ? {
                    label: 'Search',
                    onPress: () => {
                      setIsNewCustomerMode(false);
                      setShowSuggestions(false);
                    },
                    accessibilityLabel: 'Search Directory',
                  }
                : undefined
            }
            placeholder="Enter customer name"
            value={customerName}
            onChangeText={(t) => onChangeCustomerName(sanitizeCustomerNameInput(t))}
            error={nameError}
            accessibilityLabel="Customer Name"
          />

          <FormTextInput
            label="Phone Number"
            placeholder="Enter 10-digit mobile number"
            value={phone}
            onChangeText={(t) => onChangePhone(normalizePhoneInput(t))}
            keyboardType="number-pad"
            maxLength={10}
            error={phoneError}
            containerStyle={styles.inputTight}
            accessibilityLabel="Phone Number"
          />
        </View>
      )}
    </AppCard>
  );
});

const localStyles = StyleSheet.create({
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: sizes.hairline,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedName: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedPhone: {
    fontSize: 12,
    marginTop: 2,
  },
});