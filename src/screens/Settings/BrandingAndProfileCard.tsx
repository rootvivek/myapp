import React from 'react';
import { Image, Text, View } from 'react-native';
import { Store, UploadCloud } from 'lucide-react-native';
import type { AppColors } from '../../theme';
import { AppActivityIndicator } from '../../components/ui/AppActivityIndicator';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
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
    <AppCard>
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
            <AppActivityIndicator size="small" color={colors.accent} />
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
              <AppButton
                variant="secondary"
                onPress={onPickLogo}
                accessibilityLabel="Upload shop logo"
                leftIcon={<UploadCloud size={14} color={colors.text} strokeWidth={2} />}
                style={styles.inlineBtn}
                contentStyle={styles.inlineBtn}
                labelStyle={styles.inlineBtnLabel}
              >
                {logoUri ? 'Change' : 'Upload'}
              </AppButton>

              {logoUri && (
                <AppButton
                  variant="danger"
                  onPress={onRemoveLogo}
                  accessibilityLabel="Remove shop logo"
                  style={styles.inlineBtn}
                  contentStyle={styles.inlineBtn}
                  labelStyle={styles.inlineBtnLabel}
                >
                  Remove
                </AppButton>
              )}
            </View>
          )}
        </View>
      </View>
    </AppCard>
  );
});
