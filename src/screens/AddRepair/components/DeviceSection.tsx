import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Button as PaperButton, TextInput as PaperInput } from 'react-native-paper';
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
    <>
      <Text style={styles.sectionTitle}>DEVICE DETAILS</Text>

      <View style={{ position: 'relative', zIndex: 9 }}>
        <PaperInput
          label="Device Model"
          placeholder="Enter device model"
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
              background: colors.surface,
              placeholder: colors.textMuted,
            },
          }}
          style={styles.paperInput}
          left={<PaperInput.Icon icon={() => <Smartphone color={colors.accent} size={20} />} />}
          accessibilityLabel="Device Model"
          accessibilityHint="Enter or pick phone model brand"
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
      <View style={{ marginHorizontal: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
        <PaperInput
          label="IMEI (max 15 digits)"
          placeholder="Enter IMEI digits"
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
              background: colors.surface,
              placeholder: colors.textMuted,
            },
          }}
          style={styles.imeiPaperInput}
          accessibilityLabel="IMEI Number"
        />
        <PaperButton
          mode="contained"
          onPress={onScanImei}
          style={[styles.scanPaperBtn, { marginTop: 3 }]}
          contentStyle={styles.scanPaperBtnContent}
          buttonColor={colors.accent}
          textColor="#FFFFFF"
          icon={() => <ScanLine color="#FFFFFF" size={18} />}
          accessibilityRole="button"
          accessibilityLabel="Scan IMEI with camera"
        >
          Scan
        </PaperButton>
      </View>
    </>
  );
});
