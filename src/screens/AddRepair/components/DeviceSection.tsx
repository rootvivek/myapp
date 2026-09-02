import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { TextInput as PaperInput } from 'react-native-paper';
import { ScanLine, Smartphone } from 'lucide-react-native';
import type { AppColors } from '../../../theme';
import { normalizeImeiInput } from '../../../utils/repairValidation';
import { DEVICE_BRANDS } from '../constants';
import type { AddRepairStyles } from '../styles';

type Props = {
  deviceModel: string;
  imei: string;
  onChangeDeviceModel: (model: string) => void;
  onChangeImei: (imei: string) => void;
  onScanImei: () => void;
  styles: AddRepairStyles;
  colors: AppColors;
};

export const DeviceSection = React.memo(function DeviceSection({
  deviceModel,
  imei,
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
        <PaperInput
          label="Device Model"
          placeholder="e.g. Samsung Galaxy S23"
          value={deviceModel}
          onChangeText={(t) => {
            onChangeDeviceModel(t);
            setShowBrandDropdown(true);
          }}
          onFocus={() => setShowBrandDropdown(true)}
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
          style={styles.paperInput}
          left={<PaperInput.Icon icon={() => <Smartphone color={colors.accent} size={18} />} />}
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
        <PaperInput
          label="IMEI (15 digits)"
          placeholder="Enter IMEI number"
          value={imei}
          onChangeText={(t) => onChangeImei(normalizeImeiInput(t))}
          keyboardType="number-pad"
          maxLength={15}
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
          style={styles.imeiInput}
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

