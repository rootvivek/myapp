import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Store, UploadCloud } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { createStyles } from './styles';

type Props = {
  logoUri: string | null;
  logoBusy: boolean;
  isOwner: boolean;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
  colors: AppColors;
};

export const BrandingAndProfileCard = React.memo(function BrandingAndProfileCard({
  logoUri,
  logoBusy,
  isOwner,
  onPickLogo,
  onRemoveLogo,
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
          <Text style={styles.cardTitle}>Shop Branding</Text>
          <Text style={styles.cardSubtitle}>Upload your shop logo</Text>
        </View>
      </View>

      {/* Shop Logo */}
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
    </View>
  );
});

