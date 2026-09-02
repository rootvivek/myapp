import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Briefcase, Phone, Store, UploadCloud } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  shopName: string;
  setShopName: (val: string) => void;
  shopPhone: string;
  setShopPhone: (val: string) => void;
  logoUri: string | null;
  logoBusy: boolean;
  saving: boolean;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
  onSaveShopDetails: () => void;
  colors: AppColors;
};

export const ShopBrandingCard = React.memo(function ShopBrandingCard({
  shopName,
  setShopName,
  shopPhone,
  setShopPhone,
  logoUri,
  logoBusy,
  saving,
  onPickLogo,
  onRemoveLogo,
  onSaveShopDetails,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Briefcase size={18} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Shop Branding</Text>
          <Text style={styles.cardSubtitle}>Customize how your shop appears</Text>
        </View>
      </View>

      <Text style={styles.label}>Shop Logo</Text>
      <View style={styles.logoContainer}>
        {logoBusy ? (
          <View style={styles.logoPlaceholder}>
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        ) : logoUri ? (
          <View style={styles.logoPreviewWrapper}>
            <Image source={{ uri: logoUri }} style={styles.logoPreview} resizeMode="contain" />
            <View style={styles.logoActionOverlay}>
              <Pressable
                onPress={onPickLogo}
                style={({ pressed }) => [styles.logoMiniBtn, pressed && { opacity: 0.7 }]}
                android_ripple={{ color: colors.border }}
              >
                <Text style={styles.logoMiniBtnText}>Change</Text>
              </Pressable>
              <Pressable
                onPress={onRemoveLogo}
                style={({ pressed }) => [
                  styles.logoMiniBtn,
                  styles.logoMiniBtnDanger,
                  pressed && { opacity: 0.7 },
                ]}
                android_ripple={{ color: colors.border }}
              >
                <Text style={[styles.logoMiniBtnText, styles.logoMiniBtnDangerText]}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <Pressable
            onPress={onPickLogo}
            style={({ pressed }) => [styles.logoPlaceholder, pressed && { opacity: 0.8 }]}
            android_ripple={{ color: colors.border }}
          >
            <View style={styles.logoUploadCircle}>
              <UploadCloud size={20} color={colors.accent} />
            </View>
            <Text style={styles.logoPlaceholderTitle}>Upload logo</Text>
            <Text style={styles.logoPlaceholderSub}>PNG, JPG up to 2MB</Text>
          </Pressable>
        )}
      </View>

      <Text style={styles.label}>Shop Name</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputIconBox}>
          <Store size={16} color={colors.accent} />
        </View>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
          placeholder="Enter shop name"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <Text style={styles.label}>Shop Phone Number</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputIconBox}>
          <Phone size={16} color={colors.accent} />
        </View>
        <TextInput
          style={styles.input}
          value={shopPhone}
          onChangeText={setShopPhone}
          placeholder="Enter phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
        />
      </View>

      <Pressable
        onPress={onSaveShopDetails}
        disabled={saving}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Text style={styles.saveBtnText}>Save Shop Details</Text>
        )}
      </Pressable>
    </View>
  );
});
