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
import { Moon, Sun } from 'lucide-react-native';
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
  const styles = StyleSheet.create({
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
      padding: spacing.md,
      paddingBottom: 100,
    },

    label: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    labelSpaced: {
      marginTop: spacing.lg,
    },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.text,
      fontSize: 17,
      fontWeight: '600',
      marginBottom: spacing.md,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    primaryBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    btnDisabled: {
      opacity: 0.65,
    },
    logoCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    logoPreview: {
      width: '100%',
      height: 140,
      borderRadius: radius.sm,
      backgroundColor: colors.surface2,
    },
    logoPlaceholder: {
      width: '100%',
      height: 140,
      borderRadius: radius.sm,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoPlaceholderText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 15,
    },
    logoActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    secondaryBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent,
      backgroundColor: accentAlpha(colors.accent, 0.1),
      alignItems: 'center',
    },
    secondaryBtnText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 15,
    },
    dangerBtn: {
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    dangerBtnText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 15,
    },
    accountEmail: {
      color: colors.text,
      fontSize: 15,
      marginBottom: spacing.md,
    },
    signOutBtn: {
      alignItems: 'center',
      paddingVertical: 14,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
    },
    signOutText: {
      color: colors.danger,
      fontWeight: '800',
      fontSize: 16,
    },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      marginBottom: spacing.md,
    },
    themeRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    themeRowText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return styles as typeof styles & {
    logoPreview: import('react-native').ImageStyle;
  };
}

export function SettingsScreen(_props: Props) {
  const { user, signOut, isOwner, profile } = useAuth();
  const { colors, mode, setMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [shopName, setShopName] = useState('');
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoBusy, setLogoBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const b = await getShopBranding();
      setShopName(b.shopName);
      setLogoUri(b.logoUri);
    } finally {
      setLoading(false);
    }
  }, []);

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
      await saveShopBranding({ shopName: t });
      setShopName(t);
      Alert.alert('Saved', 'Shop name updated for invoices.');
    } finally {
      setSaving(false);
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


        <Text style={[styles.label, styles.labelSpaced]}>Appearance</Text>
        <View style={styles.themeRow}>
          <View style={styles.themeRowLeft}>
            {mode === 'dark' ? <Moon size={20} color={colors.accent} /> : <Sun size={20} color={colors.accent} />}
            <Text style={styles.themeRowText}>Dark Mode</Text>
          </View>
          <Switch
            value={mode === 'dark'}
            onValueChange={(val) => onThemeChoice(val ? 'dark' : 'light')}
            trackColor={{ false: colors.border, true: accentAlpha(colors.accent, 0.5) }}
            thumbColor={mode === 'dark' ? colors.accent : '#f4f3f4'}
          />
        </View>

        {/* Owner-only: Shop Branding */}
        {isOwner && (
          <>
            <Text style={[styles.label, styles.labelSpaced]}>Shop Branding</Text>
            <View style={styles.logoCard}>
              {/* Shop Logo */}
              <Text style={styles.label}>Shop Logo</Text>
              {logoUri ? (
                <>
                  <Image source={{ uri: logoUri }} style={styles.logoPreview} resizeMode="contain" />
                  <View style={styles.logoActions}>
                    <Pressable
                      onPress={() => void onPickLogo()}
                      disabled={logoBusy}
                      style={[styles.secondaryBtn, logoBusy && styles.btnDisabled]}
                      android_ripple={{ color: colors.border }}
                    >
                      <Text style={styles.secondaryBtnText}>Change logo</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => void onRemoveLogo()}
                      disabled={logoBusy}
                      style={[styles.dangerBtn, logoBusy && styles.btnDisabled]}
                      android_ripple={{ color: colors.border }}
                    >
                      <Text style={styles.dangerBtnText}>Remove</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Pressable
                  onPress={() => void onPickLogo()}
                  disabled={logoBusy}
                  style={({ pressed }) => [
                    styles.logoPlaceholder,
                    pressed && { opacity: 0.7 }
                  ]}
                  android_ripple={{ color: colors.border }}
                >
                  <Text style={styles.logoPlaceholderText}>Choose logo</Text>
                </Pressable>
              )}

              <View style={{ height: spacing.lg }} />

              {/* Shop Name */}
              <Text style={styles.label}>Shop Name</Text>
              <TextInput
                value={shopName}
                onChangeText={setShopName}
                placeholder="MCA Phone Wala"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { marginBottom: 12 }]}
                autoCapitalize="words"
              />
              <Pressable
                onPress={() => void onSaveName()}
                disabled={saving}
                style={[styles.primaryBtn, saving && styles.btnDisabled]}
                android_ripple={{ color: '#fff' }}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>Save shop name</Text>
                )}
              </Pressable>
            </View>
          </>
        )}

        {/* Owner-only: Customers & Team */}
        {isOwner && (
          <>
            <Text style={[styles.label, styles.labelSpaced]}>Customers</Text>
            <Pressable
              onPress={() => _props.navigation.navigate('CustomerDirectory')}
              style={styles.signOutBtn}
              android_ripple={{ color: colors.border }}
            >
              <Text style={[styles.signOutText, { color: colors.accent }]}>Manage Customers</Text>
            </Pressable>

            <Text style={[styles.label, styles.labelSpaced]}>Team</Text>
            <Pressable
              onPress={() => _props.navigation.navigate('ManageLabour')}
              style={styles.signOutBtn}
              android_ripple={{ color: colors.border }}
            >
              <Text style={[styles.signOutText, { color: colors.accent }]}>Manage Team</Text>
            </Pressable>
          </>
        )}

        <Text style={[styles.label, styles.labelSpaced]}>Account</Text>
        <Text style={styles.accountEmail} selectable>
          {user?.email ?? '—'}
        </Text>
        {profile && (
          <View style={{
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 12,
            backgroundColor: isOwner ? accentAlpha(colors.accent, 0.15) : accentAlpha(colors.success, 0.15),
            marginBottom: spacing.md,
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '800',
              color: isOwner ? colors.accent : colors.success,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}>
              {isOwner ? '👑 Owner' : '🔧 Team'}
            </Text>
          </View>
        )}
        <Pressable
          onPress={() => void signOut()}
          style={styles.signOutBtn}
          android_ripple={{ color: colors.border }}
        >
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
