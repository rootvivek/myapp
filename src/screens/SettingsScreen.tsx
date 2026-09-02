import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Crown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { checkAppUpdate, CURRENT_VERSION_NAME } from '../components/AutoUpdater';
import { launchLibraryForImage } from '../utils/pickImage';
import {
  clearShopLogo,
  getShopBranding,
  saveShopBranding,
  setShopLogoFromPickerUri,
} from '../utils/shopSettings';

import { AccountCard } from './Settings/AccountCard';
import { AppearanceCard } from './Settings/AppearanceCard';
import { ProfileCard } from './Settings/ProfileCard';
import { ShopBrandingCard } from './Settings/ShopBrandingCard';
import { createStyles } from './Settings/styles';
import { TeamCard } from './Settings/TeamCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { user, signOut, isOwner, profile, updateProfileName, updateShopName } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [shopName, setShopName] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
    }
  }, [profile]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getShopBranding();
      setShopName(profile?.shopName || b.shopName);
      setLogoUri(b.logoUri);
      setShopPhone(b.shopPhone);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onManualCheckUpdate() {
    setCheckingUpdate(true);
    try {
      const info = await checkAppUpdate();
      if (info && info.hasUpdate) {
        Alert.alert(
          'New Update Available',
          `Version v${info.versionName} is available. Download now?`,
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Download',
              onPress: () => {
                if (!info.apkUrl.startsWith('https://')) {
                  Alert.alert('Security Warning', 'Download URL must use HTTPS. Update rejected.');
                  return;
                }
                void Linking.openURL(info.apkUrl);
              },
            },
          ]
        );
      } else {
        Alert.alert('Up to date', `You are on the latest version (v${CURRENT_VERSION_NAME}).`);
      }
    } catch {
      Alert.alert('Error', 'Failed to check for updates. Try again later.');
    } finally {
      setCheckingUpdate(false);
    }
  }

  async function onSaveShopDetails() {
    const nameTrimmed = shopName.trim();
    const phoneTrimmed = shopPhone.trim();
    if (!nameTrimmed) {
      Alert.alert('Shop name', 'Enter a shop name.');
      return;
    }
    setSaving(true);
    try {
      if (isOwner) {
        await updateShopName(nameTrimmed);
      }
      await saveShopBranding({ shopName: nameTrimmed, shopPhone: phoneTrimmed });
      setShopName(nameTrimmed);
      setShopPhone(phoneTrimmed);
      Alert.alert('Saved', 'Shop details updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error occurred.';
      Alert.alert('Failed to save shop details', msg);
    } finally {
      setSaving(false);
    }
  }

  async function onSaveProfileName() {
    const t = profileName.trim();
    if (!t) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setProfileSaving(true);
    try {
      await updateProfileName(t);
      Alert.alert('Saved', 'Profile name updated successfully.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error occurred.';
      Alert.alert('Failed to save profile name', msg);
    } finally {
      setProfileSaving(false);
    }
  }

  async function onPickLogo() {
    setLogoBusy(true);
    try {
      const uri = await launchLibraryForImage();
      if (!uri) return;
      await setShopLogoFromPickerUri(uri);
      const b = await getShopBranding();
      setLogoUri(b.logoUri);
    } catch {
      Alert.alert('Logo', 'Could not save the logo. Try another image.');
    } finally {
      setLogoBusy(false);
    }
  }

  async function onRemoveLogo() {
    setLogoBusy(true);
    try {
      await clearShopLogo();
      setLogoUri(null);
    } finally {
      setLogoBusy(false);
    }
  }

  const userInitial = useMemo(() => {
    if (profile?.name) return profile.name[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return '?';
  }, [profile, user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Profile & Settings</Text>
            <Text style={styles.headerSubtitle}>Manage your shop and account</Text>
          </View>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            {isOwner && (
              <View style={styles.crownBadge}>
                <Crown size={10} color="#F59E0B" fill="#F59E0B" />
              </View>
            )}
          </View>
        </View>

        {/* Card 1: Appearance */}
        <AppearanceCard
          mode={mode}
          onThemeChange={(dark) => void setMode(dark ? 'dark' : 'light')}
          colors={colors}
        />

        {/* Card 2: Shop Branding (Owner only) */}
        {isOwner && (
          <ShopBrandingCard
            shopName={shopName}
            setShopName={setShopName}
            shopPhone={shopPhone}
            setShopPhone={setShopPhone}
            logoUri={logoUri}
            logoBusy={logoBusy}
            saving={saving}
            onPickLogo={() => void onPickLogo()}
            onRemoveLogo={() => void onRemoveLogo()}
            onSaveShopDetails={() => void onSaveShopDetails()}
            colors={colors}
          />
        )}

        {/* Card 3: Profile Name */}
        <ProfileCard
          profileName={profileName}
          setProfileName={setProfileName}
          profileSaving={profileSaving}
          onSaveProfileName={() => void onSaveProfileName()}
          colors={colors}
        />

        {/* Card 4: Manage Labour (Owner only) */}
        {isOwner && (
          <TeamCard
            onManageLabour={() => navigation.navigate('ManageLabour')}
            colors={colors}
          />
        )}

        {/* Card 5: Account & App */}
        <AccountCard
          userEmail={user?.email}
          checkingUpdate={checkingUpdate}
          onCheckUpdate={() => void onManualCheckUpdate()}
          onSignOut={() => void signOut()}
          colors={colors}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
