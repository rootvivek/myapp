import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Crown, ShieldAlert } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { checkAppUpdate, CURRENT_VERSION_NAME } from '../components/AutoUpdater';
import { logger } from '../utils/logger';
import { launchLibraryForImage } from '../utils/pickImage';
import {
  clearShopLogo,
  getShopBranding,
  setShopLogoFromPickerUri,
  uploadShopLogoFromPickerUri,
} from '../utils/shopSettings';

import { AccountCard } from './Settings/AccountCard';
import { AppearanceCard } from './Settings/AppearanceCard';
import { BrandingAndProfileCard } from './Settings/BrandingAndProfileCard';
import { ProfileEditCard } from './Settings/ProfileEditCard';
import { createStyles } from './Settings/styles';
import { TeamCard } from './Settings/TeamCard';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const {
    user,
    signOut,
    isOwner,
    isAdmin,
    profile,
    updateProfileLogo,
    updateProfileDetails,
  } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoBusy, setLogoBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);

  const [checkingUpdate, setCheckingUpdate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const scopeKey = profile?.shopId || user?.id;
      const b = await getShopBranding(scopeKey);
      setLogoUri(profile?.shopLogoUrl || b.logoUri);
    } finally {
      setLoading(false);
    }
  }, [profile, user]);

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

  async function onPickLogo() {
    setLogoBusy(true);
    try {
      const uri = await launchLibraryForImage();
      if (!uri) return;
      const scopeKey = profile?.shopId || user?.id;
      const logoUrl = await uploadShopLogoFromPickerUri(uri);
      await setShopLogoFromPickerUri(logoUrl, scopeKey);
      try {
        await updateProfileLogo(logoUrl);
      } catch (dbNotice) {
        logger.warn('[SettingsScreen] Non-blocking logo DB save notice:', dbNotice);
      }
      const b = await getShopBranding(scopeKey);
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
      const scopeKey = profile?.shopId || user?.id;
      await clearShopLogo(scopeKey);
      try {
        await updateProfileLogo(null);
      } catch (dbNotice) {
        logger.warn('[SettingsScreen] Non-blocking logo DB clear notice:', dbNotice);
      }
      setLogoUri(null);
    } finally {
      setLogoBusy(false);
    }
  }

  async function onSaveProfileDetails(name: string, shopName: string) {
    setProfileBusy(true);
    try {
      await updateProfileDetails(name, shopName);
      Alert.alert('Saved', 'Profile details updated.');
    } catch (err) {
      Alert.alert('Save failed', err instanceof Error ? err.message : 'Could not update profile details.');
    } finally {
      setProfileBusy(false);
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
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            {isOwner && (
              <View style={styles.crownBadge}>
                <Crown size={11} color="#F59E0B" fill="#F59E0B" />
              </View>
            )}
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName} numberOfLines={1}>
              {profile?.name || user?.email?.split('@')[0] || 'User Profile'}
            </Text>
            <Text style={styles.heroEmail} numberOfLines={1}>
              {user?.email || 'Logged in'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
              {isOwner ? '👑 Shop Owner' : '👷 Team Member'}
                {profile?.shopName ? ` · ${profile.shopName}` : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Card 1: Appearance */}
        <AppearanceCard
          mode={mode}
          onThemeChange={(dark) => void setMode(dark ? 'dark' : 'light')}
          colors={colors}
        />

        {/* Card 2: Shop Branding */}
        <BrandingAndProfileCard
          logoUri={logoUri}
          logoBusy={logoBusy}
          isOwner={isOwner}
          onPickLogo={() => void onPickLogo()}
          onRemoveLogo={() => void onRemoveLogo()}
          colors={colors}
        />

        <ProfileEditCard
          name={profile?.name || ''}
          shopName={profile?.shopName || ''}
          isOwner={isOwner}
          busy={profileBusy}
          onSave={(name, shopName) => void onSaveProfileDetails(name, shopName)}
          colors={colors}
        />

        {/* Card 3: Manage Labour (Owner only) */}
        {isOwner && (
          <TeamCard
            onManageLabour={() => navigation.navigate('ManageLabour')}
            colors={colors}
          />
        )}

        {/* Admin Dashboard Card (Admin only) */}
        {isAdmin && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <Pressable
              onPress={() => navigation.navigate('AdminDashboard')}
              android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#DC262620',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <ShieldAlert size={20} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                  Admin Dashboard
                </Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                  Manage shops, users & system data
                </Text>
              </View>
              <Text style={{ color: colors.textMuted, fontSize: 18 }}>›</Text>
            </Pressable>
          </View>
        )}

        {/* Card 4: Account & App */}
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
