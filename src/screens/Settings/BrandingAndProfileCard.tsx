import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Check, Phone, Store, UploadCloud, User } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  shopName: string;
  setShopName: (val: string) => void;
  shopPhone: string;
  setShopPhone: (val: string) => void;
  profileName: string;
  setProfileName: (val: string) => void;
  logoUri: string | null;
  logoBusy: boolean;
  saving: boolean;
  isOwner: boolean;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
  onSaveAllDetails: () => void;
  colors: AppColors;
};

export const BrandingAndProfileCard = React.memo(function BrandingAndProfileCard({
  shopName,
  setShopName,
  shopPhone,
  setShopPhone,
  profileName,
  setProfileName,
  logoUri,
  logoBusy,
  saving,
  isOwner,
  onPickLogo,
  onRemoveLogo,
  onSaveAllDetails,
  colors,
}: Props) {
  const styles = createStyles(colors);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconBox}>
          <Store size={18} color={colors.accent} />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.cardTitle}>Profile & Shop Details</Text>
          <Text style={styles.cardSubtitle}>Manage your name and shop branding</Text>
        </View>
      </View>

      {/* 1. Shop Logo (Side Circle Layout) */}
      <View style={styles.logoRow}>
        <View style={styles.logoCircleWrapper}>
          {logoBusy ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoCircleImage} resizeMode="cover" />
          ) : (
            <Store size={22} color={colors.accent} />
          )}
        </View>

        <View style={styles.logoInfoSide}>
          <Text style={styles.logoSideTitle}>Shop Logo</Text>
          <Text style={styles.logoSideSub}>
            {logoUri ? 'Used on invoices & receipts' : 'Upload PNG or JPG logo'}
          </Text>

          {isOwner && (
            <View style={styles.logoSideActions}>
              <Pressable
                onPress={onPickLogo}
                style={({ pressed }) => [styles.logoMiniBtn, pressed && { opacity: 0.7 }]}
                android_ripple={{ color: colors.border }}
                accessibilityRole="button"
                accessibilityLabel="Upload shop logo"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <UploadCloud size={12} color={colors.text} />
                  <Text style={styles.logoMiniBtnText}>{logoUri ? 'Change' : 'Upload'}</Text>
                </View>
              </Pressable>

              {logoUri && (
                <Pressable
                  onPress={onRemoveLogo}
                  style={({ pressed }) => [
                    styles.logoMiniBtn,
                    styles.logoMiniBtnDanger,
                    pressed && { opacity: 0.7 },
                  ]}
                  android_ripple={{ color: colors.border }}
                  accessibilityRole="button"
                  accessibilityLabel="Remove shop logo"
                >
                  <Text style={[styles.logoMiniBtnText, styles.logoMiniBtnDangerText]}>Remove</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>

      {/* 2. Your Name */}
      <Text style={styles.label}>Your Name</Text>
      <View style={styles.inputContainer}>
        <View style={styles.inputIconBox}>
          <User size={16} color={colors.accent} />
        </View>
        <TextInput
          style={styles.input}
          value={profileName}
          onChangeText={setProfileName}
          placeholder="Your name"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      {/* 3. Shop Name */}
      <Text style={styles.label}>Shop Name</Text>
      <View style={[styles.inputContainer, !isOwner && { opacity: 0.7 }]}>
        <View style={styles.inputIconBox}>
          <Store size={16} color={colors.accent} />
        </View>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
          placeholder="Shop name"
          placeholderTextColor={colors.textMuted}
          editable={isOwner}
        />
      </View>

      {/* 4. Shop/Contact Phone Number */}
      <Text style={styles.label}>Shop Phone Number</Text>
      <View style={[styles.inputContainer, !isOwner && { opacity: 0.7 }]}>
        <View style={styles.inputIconBox}>
          <Phone size={16} color={colors.accent} />
        </View>
        <TextInput
          style={styles.input}
          value={shopPhone}
          onChangeText={setShopPhone}
          placeholder="Phone number"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          editable={isOwner}
        />
      </View>

      <Pressable
        onPress={onSaveAllDetails}
        disabled={saving}
        style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.8 }]}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.saveBtnInner}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={18} color="#FFFFFF" strokeWidth={2.4} />
              <Text style={styles.saveBtnText}>Save Details</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    </View>
  );
});

