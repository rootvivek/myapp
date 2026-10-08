import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { FormTextInput } from '../../../components/FormTextInput';
import { normalizeImeiInput, type RepairFormErrors } from '../../../utils/repairValidation';
import { DEVICE_BRANDS } from '../constants';
import type { AddRepairStyles } from '../styles';
import { AppCard } from '../../../components/ui/AppCard';

type Props = {
  deviceModel: string;
  imei: string;
  errors?: RepairFormErrors;
  onChangeDeviceModel: (model: string) => void;
  onChangeImei: (imei: string) => void;
  onScanImei: () => void;
  styles: AddRepairStyles;
};

export const DeviceSection = React.memo(function DeviceSection({
  deviceModel,
  imei,
  errors,
  onChangeDeviceModel,
  onChangeImei,
  onScanImei,
  styles,
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
    <AppCard>
      {/* Device Model */}
      <View style={{ position: 'relative', zIndex: 9 }}>
        <FormTextInput
          label="Device Model"
          placeholder="e.g. iPhone 15, Samsung S24"
          value={deviceModel}
          onChangeText={(t) => {
            onChangeDeviceModel(t);
            setShowBrandDropdown(true);
          }}
          onFocus={() => setShowBrandDropdown(true)}
          error={errors?.deviceModel}
          accessibilityLabel="Device Model"
        />

        {matches.length > 0 && (
          <View style={styles.brandSuggestContainer}>
            <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
              {matches.map((brand) => (
                <Pressable
                  key={brand}
                  style={styles.suggestionItem}
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

      {/* IMEI */}
      <FormTextInput
        label="IMEI"
        placeholder="IMEI (15 digits)"
        value={imei}
        onChangeText={(t) => onChangeImei(normalizeImeiInput(t))}
        keyboardType="number-pad"
        maxLength={15}
        containerStyle={styles.inputTight}
        rightAction={{
          label: 'Scan',
          onPress: onScanImei,
          accessibilityLabel: 'Scan IMEI with camera',
        }}
        accessibilityLabel="IMEI Number"
      />
    </AppCard>
  );
});