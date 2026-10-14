import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { Save, Store, UploadCloud } from 'lucide-react-native';
import { spacing } from '../../theme';
import type { AppColors } from '../../theme';
import { AppActivityIndicator } from '../../components/ui/AppActivityIndicator';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { createStyles } from './styles';

type Props = {
  name: string;
  shopName: string;
  isOwner: boolean;
  busy: boolean;
  logoUri: string | null;
  logoBusy: boolean;
  onPickLogo: () => void;
  onRemoveLogo: () => void;
  colors: AppColors;
  onSave: (name: string, shopName: string) => void;
};

export const ProfileEditCard = React.memo(function ProfileEditCard({
  name,
  shopName,
  isOwner,
  busy,
  logoUri,
  logoBusy,
  onPickLogo,
  onRemoveLogo,
  colors,
  onSave,
}: Props) {
  const styles = createStyles(colors);
  const [draftName, setDraftName] = useState(name);
  const [draftShopName, setDraftShopName] = useState(shopName);

  useEffect(() => {
    setDraftName(name);
    setDraftShopName(shopName);
  }, [name, shopName]);

  return (
    <AppCard>
      {/* Shop Logo Row */}
      <View style={[styles.logoRow, { marginTop: 0, marginBottom: spacing.sm + 2 }]}>
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

      <AppInput
        label="Your name"
        value={draftName}
        onChangeText={setDraftName}
        placeholder="Your name"
        editable={!busy}
        accessibilityLabel="Your name"
      />

      {isOwner && (
        <AppInput
          label="Shop name"
          value={draftShopName}
          onChangeText={setDraftShopName}
          placeholder="Shop name"
          editable={!busy}
          accessibilityLabel="Shop name"
        />
      )}

      <AppButton
        fullWidth
        loading={busy}
        disabled={busy}
        onPress={() => onSave(draftName, draftShopName)}
        leftIcon={<Save size={18} color="#FFFFFF" strokeWidth={2.4} />}
        accessibilityLabel="Save profile details"
        containerStyle={{ marginTop: spacing.sm }}
      >
        Save Details
      </AppButton>
    </AppCard>
  );
});

