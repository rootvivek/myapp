import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { CheckCircle2, Phone, Search, User, UserPlus, X } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { accentAlpha } from '../../../theme';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isNewCustomerMode, setIsNewCustomerMode] = useState(false);
  const [selectedExisting, setSelectedExisting] = useState(false);

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
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <User size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Customer Information</Text>
        </View>
      </View>

      {/* Mode 1: Search Customer (if not in edit mode and not in new customer manual mode) */}
      {!isEdit && !isNewCustomerMode && !selectedExisting && (
        <View style={{ zIndex: 10 }}>
          <View style={styles.searchCustomerRow}>
            <PaperInput
              placeholder="Search customer (Name or Phone)..."
              value={searchQuery}
              onChangeText={(t) => {
                setSearchQuery(t);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
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
              style={styles.searchCustomerInput}
              left={<PaperInput.Icon icon={() => <Search color={colors.accent} size={18} />} />}
              accessibilityLabel="Search customer"
            />

            <Pressable
              onPress={handleToggleNewCustomer}
              style={({ pressed }) => [styles.newCustomerBtn, pressed && { opacity: 0.8 }]}
              accessibilityRole="button"
              accessibilityLabel="Add new customer"
            >
              <UserPlus size={18} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          </View>

          {matches.length > 0 && (
            <View style={styles.suggestionsContainer}>
              {matches.slice(0, 4).map((c) => (
                <Pressable
                  key={c.phone}
                  style={styles.suggestionItem}
                  android_ripple={{ color: colors.border }}
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

      {/* Selected Existing Customer Card */}
      {!isEdit && selectedExisting && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: accentAlpha(colors.accent, 0.1),
            padding: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: accentAlpha(colors.accent, 0.3),
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
            <CheckCircle2 size={20} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14.5, fontWeight: '700' }}>
                {customerName}
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 1 }}>
                {phone}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleClearSelection}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 6,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 11.5, fontWeight: '600' }}>Change</Text>
          </Pressable>
        </View>
      )}

      {/* Mode 2: Separate Column Inputs for Customer Name and Phone (Shown in Edit mode OR when user clicks New Customer) */}
      {(isEdit || isNewCustomerMode) && (
        <View style={{ gap: 8 }}>
          {!isEdit && (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 2,
              }}
            >
              <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>
                ✦ New Customer
              </Text>
              <Pressable
                onPress={() => {
                  setIsNewCustomerMode(false);
                  setShowSuggestions(false);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Search size={12} color={colors.textMuted} />
                <Text style={{ color: colors.textMuted, fontSize: 11.5, fontWeight: '600' }}>
                  Search Directory
                </Text>
              </Pressable>
            </View>
          )}

          {/* Separate Column 1: Customer Name */}
          <PaperInput
            label="Customer Name"
            placeholder="Enter customer full name"
            value={customerName}
            onChangeText={(t) => onChangeCustomerName(sanitizeCustomerNameInput(t))}
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
            style={[styles.paperInput, { marginBottom: 0 }]}
            left={<PaperInput.Icon icon={() => <User color={colors.accent} size={18} />} />}
            accessibilityLabel="Customer Name"
          />

          {/* Separate Column 2: Customer Phone Number */}
          <PaperInput
            label="Phone Number"
            placeholder="Enter 10-digit mobile number"
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
                background: colors.surface2,
                placeholder: colors.textMuted,
              },
            }}
            style={[styles.paperInput, { marginBottom: 0 }]}
            left={<PaperInput.Icon icon={() => <Phone color={colors.accent} size={18} />} />}
            accessibilityLabel="Phone Number"
          />
        </View>
      )}
    </View>
  );
});


