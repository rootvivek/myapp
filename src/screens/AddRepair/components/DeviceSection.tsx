import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ScanLine, Smartphone } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { FormTextInput } from '../../../components/FormTextInput';
import { normalizeImeiInput, type RepairFormErrors } from '../../../utils/repairValidation';
import { DEVICE_BRANDS } from '../constants';
import type { AddRepairStyles } from '../styles';

type Props = {
  deviceModel: string;
  imei: string;
  /** Inline validation messages keyed by field. */
  errors?: RepairFormErrors;
  onChangeDeviceModel: (model: string) => void;
  onChangeImei: (imei: string) => void;
  onScanImei: () => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const DeviceSection = React.memo(function DeviceSection({
  deviceModel,
  imei,
  errors,
  onChangeDeviceModel,
  onChangeImei,
  onScanImei,
  styles,
  colors,
}: Props) {
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const query = deviceModel.trim().toLowerCase();
  const matches =
    showBrandDropdown
      ? query.length === 0
        ? DEVICE_BRANDS
        : DEVICE_BRANDS.filter((b) => b.toLowerCase().includes(query))
      : [];

  return (
    <View style={styles.formCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderIcon}>
          <Smartphone size={16} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Device Details</Text>
        </View>
      </View>

      <View style={{ position: 'relative', zIndex: 9 }}>
        <FormTextInput
          label="Device Model"
          placeholder="e.g. Samsung Galaxy S23"
          value={deviceModel}
          onChangeText={(t) => {
            onChangeDeviceModel(t);
            setShowBrandDropdown(true);
          }}
          onFocus={() => setShowBrandDropdown(true)}
          error={errors?.deviceModel}
          icon={Smartphone}
          containerStyle={styles.inputStack}
          accessibilityLabel="Device Model"
        />

        {matches.length > 0 && (
          <View style={styles.brandSuggestContainer}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {matches.map((brand) => (
                <Pressable
                  key={brand}
                  style={styles.suggestionItem}
                  android_ripple={{ color: colors.border }}
                  onPress={() => {
                    onChangeDeviceModel(brand + ' ');
                    setShowBrandDropdown(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select brand ${brand}`}
                >
                  <Text style={styles.suggestionName}>{brand}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* IMEI Row */}
      <View style={styles.imeiRow}>
        <FormTextInput
          label="IMEI (15 digits)"
          placeholder="Enter IMEI number"
          value={imei}
          onChangeText={(t) => onChangeImei(normalizeImeiInput(t))}
          keyboardType="number-pad"
          maxLength={15}
          containerStyle={styles.inputFlex}
          accessibilityLabel="IMEI Number"
        />

        <Pressable
          onPress={onScanImei}
          style={({ pressed }) => [styles.scanBtn, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Scan IMEI with camera"
        >
          <ScanLine color="#FFFFFF" size={16} />
          <Text style={styles.scanBtnText}>Scan</Text>
        </Pressable>
      </View>
    </View>
  );
});

