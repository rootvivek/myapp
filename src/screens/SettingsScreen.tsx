import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
} from 'react-native';
import { Moon, Sun, Briefcase, UploadCloud, Store, Users, User, ChevronRight, Shield, Mail, LogOut, CheckCircle, Crown } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { accentAlpha, radius, spacing } from '../theme';
import type { ThemePreference } from '../context/ThemeContext';
import { launchLibraryForImage } from '../utils/pickImage';
import { clearShopLogo, getShopBranding, saveShopBranding, setShopLogoFromPickerUri } from '../utils/shopSettings';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: 120,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
      marginTop: 8,
    },
    headerInfo: {
      flex: 1,
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    headerSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.accent,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarText: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    crownBadge: {
      position: 'absolute',
      bottom: -3,
      right: -3,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: '#0F172A',
      borderWidth: 1.5,
      borderColor: '#1E293B',
      justifyContent: 'center',
      alignItems: 'center',
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: accentAlpha(colors.accent, 0.12),
      justifyContent: 'center',
      alignItems: 'center',
    },
    cardHeaderInfo: {
      flex: 1,
      marginLeft: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 16,
      marginBottom: 8,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rowInfo: {
      flex: 1,
      marginLeft: 12,
    },
    rowTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
    },
    rowSubtitle: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 12,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 52,
    },
    inputIconBox: {
      width: 32,
      height: 32,
      borderRadius: 6,
      backgroundColor: accentAlpha(colors.accent, 0.1),
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      padding: 0,
    },
    btnPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      borderRadius: 12,
      height: 48,
      marginTop: 16,
    },
    btnPrimaryText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    btnIconRight: {
      position: 'absolute',
      right: 16,
    },
    roleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      gap: 4,
    },
    roleBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    btnDangerOutline: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1.2,
      borderColor: colors.danger,
      borderRadius: 12,
      height: 48,
      marginTop: 16,
    },
    btnDangerOutlineText: {
      color: colors.danger,
      fontSize: 15,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.6,
    },
    logoContainer: {
      marginTop: 8,
      marginBottom: 16,
    },
    logoPreviewWrapper: {
      width: '100%',
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      backgroundColor: colors.surface2,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
    },
    logoPreview: {
      width: '100%',
      height: '100%',
      borderRadius: 8,
    },
    logoActionOverlay: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      flexDirection: 'row',
      gap: 8,
    },
    logoMiniBtn: {
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    logoMiniBtnDanger: {
      borderColor: 'rgba(239, 68, 68, 0.4)',
    },
    logoMiniBtnText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    logoMiniBtnDangerText: {
      color: colors.danger,
    },
    logoPlaceholder: {
      width: '100%',
      height: 140,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      backgroundColor: colors.surface2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoUploadCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: accentAlpha(colors.accent, 0.12),
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    logoPlaceholderTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    logoPlaceholderSub: {
      color: colors.textMuted,
      fontSize: 12,
      marginTop: 4,
    },
  });
}

export function SettingsScreen(_props: Props) {
  const { user, signOut, isOwner, profile, updateProfileName, updateShopName } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [shopName, setShopName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  const [profileName, setProfileName] = useState(profile?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || '');
    }
  }, [profile]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (profile?.shopName) {
        setShopName(profile.shopName);
      } else {
        const b = await getShopBranding();
        setShopName(b.shopName);
      }
      const b = await getShopBranding();
      setLogoUri(b.logoUri);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSaveName() {
    const t = shopName.trim();
    if (!t) {
      Alert.alert('Shop name', 'Enter a shop name.');
      return;
    }
    setSaving(true);
    try {
      await updateShopName(t);
      setShopName(t);
      Alert.alert('Saved', 'Shop name updated successfully.');
    } catch (err: any) {
      Alert.alert('Failed to save shop name', err.message || 'Error occurred.');
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
    } catch (err: any) {
      Alert.alert('Failed to save profile name', err.message || 'Error occurred.');
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

  function onThemeChoice(next: ThemePreference) {
    void setMode(next);
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
        {/* Premium Header */}
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
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                {mode === 'dark' ? (
                  <Moon size={18} color={colors.accent} />
                ) : (
                  <Sun size={18} color={colors.accent} />
                )}
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>Dark Mode</Text>
                <Text style={styles.rowSubtitle}>Keep the app easy on your eyes</Text>
              </View>
            </View>
            <Switch
              value={mode === 'dark'}
              onValueChange={(val) => onThemeChoice(val ? 'dark' : 'light')}
              trackColor={{ false: colors.border, true: accentAlpha(colors.accent, 0.5) }}
              thumbColor={mode === 'dark' ? colors.accent : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Card 2: Shop Branding (Owner only) */}
        {isOwner && (
          <View style={styles.card}>
            {/* Shop Branding Header Row */}
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <Briefcase size={18} color={colors.accent} />
              </View>
              <View style={styles.cardHeaderInfo}>
                <Text style={styles.cardTitle}>Shop Branding</Text>
                <Text style={styles.cardSubtitle}>Customize how your shop appears</Text>
              </View>
            </View>

            {/* Shop Logo sub-section */}
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
                      onPress={() => void onPickLogo()}
                      style={({ pressed }) => [
                        styles.logoMiniBtn,
                        pressed && { opacity: 0.7 }
                      ]}
                      android_ripple={{ color: colors.border }}
                    >
                      <Text style={styles.logoMiniBtnText}>Change</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void onRemoveLogo()}
                      style={({ pressed }) => [
                        styles.logoMiniBtn,
                        styles.logoMiniBtnDanger,
                        pressed && { opacity: 0.7 }
                      ]}
                      android_ripple={{ color: colors.border }}
                    >
                      <Text style={[styles.logoMiniBtnText, styles.logoMiniBtnDangerText]}>Remove</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onPress={() => void onPickLogo()}
                  style={({ pressed }) => [
                    styles.logoPlaceholder,
                    pressed && { opacity: 0.8 }
                  ]}
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

            {/* Shop Name sub-section */}
            <Text style={styles.label}>Shop Name</Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconBox}>
                <Store size={16} color={colors.accent} />
              </View>
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                placeholder="MCA Phone Wala"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
                autoCapitalize="words"
              />
            </View>

            <Pressable
              onPress={() => void onSaveName()}
              disabled={saving}
              style={({ pressed }) => [
                styles.btnPrimary,
                saving && styles.btnDisabled,
                pressed && { opacity: 0.85 }
              ]}
              android_ripple={{ color: '#fff' }}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Save Shop Name</Text>
                  <View style={styles.btnIconRight}>
                    <CheckCircle size={18} color="#FFFFFF" />
                  </View>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* Card 3: Customers & Team navigation (Owner only) */}
        {isOwner && (
          <View style={styles.card}>
            {/* Customers navigation row */}
            <Pressable
              onPress={() => _props.navigation.navigate('CustomerDirectory')}
              style={({ pressed }) => [
                styles.row,
                pressed && { opacity: 0.7 }
              ]}
              android_ripple={{ color: colors.border }}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <Users size={18} color={colors.accent} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>Customers</Text>
                  <Text style={styles.rowSubtitle}>View and manage your customers</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.accent} />
            </Pressable>

            <View style={styles.divider} />

            {/* Team navigation row */}
            <Pressable
              onPress={() => _props.navigation.navigate('ManageLabour')}
              style={({ pressed }) => [
                styles.row,
                pressed && { opacity: 0.7 }
              ]}
              android_ripple={{ color: colors.border }}
            >
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <Users size={18} color={colors.accent} />
                </View>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle}>Team</Text>
                  <Text style={styles.rowSubtitle}>Manage your team members</Text>
                </View>
              </View>
              <ChevronRight size={18} color={colors.accent} />
            </Pressable>
          </View>
        )}

        {/* Card 4: Account Card */}
        <View style={styles.card}>
          {/* Card Header Row */}
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <Shield size={18} color={colors.accent} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.cardTitle}>Account</Text>
              <Text style={styles.cardSubtitle}>Manage your account details</Text>
            </View>
            <View style={[
              styles.roleBadge,
              { backgroundColor: isOwner ? 'rgba(245, 158, 11, 0.12)' : 'rgba(34, 197, 94, 0.12)' }
            ]}>
              {isOwner ? (
                <>
                  <Crown size={10} color="#F59E0B" fill="#F59E0B" />
                  <Text style={[styles.roleBadgeText, { color: '#F59E0B' }]}>OWNER</Text>
                </>
              ) : (
                <>
                  <Shield size={10} color="#22C55E" />
                  <Text style={[styles.roleBadgeText, { color: '#22C55E' }]}>TEAM</Text>
                </>
              )}
            </View>
          </View>

          {/* Email row (read-only info) */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <Mail size={18} color={colors.accent} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={[styles.rowTitle, { fontWeight: '500' }]} selectable>
                  {user?.email ?? '—'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Your Name row (editable input field) */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBox}>
                <User size={18} color={colors.accent} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: '600' }}>Your Name</Text>
                <TextInput
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="Vivek"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { marginTop: 2 }]}
                  autoCapitalize="words"
                />
              </View>
            </View>
            <ChevronRight size={18} color={colors.accent} />
          </View>

          <Pressable
            onPress={() => void onSaveProfileName()}
            disabled={profileSaving}
            style={({ pressed }) => [
              styles.btnPrimary,
              profileSaving && styles.btnDisabled,
              pressed && { opacity: 0.85 }
            ]}
            android_ripple={{ color: '#fff' }}
          >
            {profileSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.btnPrimaryText}>Save Profile Name</Text>
                <View style={styles.btnIconRight}>
                  <CheckCircle size={18} color="#FFFFFF" />
                </View>
              </>
            )}
          </Pressable>

          {/* Sign Out Button inside Account Card */}
          <Pressable
            onPress={() => void signOut()}
            style={({ pressed }) => [
              styles.btnDangerOutline,
              pressed && { opacity: 0.8 }
            ]}
            android_ripple={{ color: colors.danger }}
          >
            <Text style={styles.btnDangerOutlineText}>Sign Out</Text>
            <View style={styles.btnIconRight}>
              <LogOut size={16} color={colors.danger} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
