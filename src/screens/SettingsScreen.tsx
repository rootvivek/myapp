import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { accentAlpha, radius, spacing } from '../theme';
import type { ThemePreference } from '../utils/themeStorage';
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
      padding: spacing.md,
      paddingBottom: spacing.xl,
    },
    lead: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      marginBottom: spacing.lg,
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
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    themeChip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface2,
      alignItems: 'center',
    },
    themeChipActive: {
      borderColor: colors.accent,
      backgroundColor: accentAlpha(colors.accent, 0.12),
    },
    themeChipText: {
      color: colors.textMuted,
      fontWeight: '700',
      fontSize: 15,
    },
    themeChipTextActive: {
      color: colors.accent,
    },
  });
}

export function SettingsScreen(_props: Props) {
  const { user, signOut } = useAuth();
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
        <Text style={styles.lead}>
          This name and logo appear at the top of shared PDF invoices. Without a logo, invoices show your shop initial in a
          badge.
        </Text>

        <Text style={[styles.label, styles.labelSpaced]}>Appearance</Text>
        <View style={styles.themeRow}>
          <Pressable
            onPress={() => onThemeChoice('light')}
            style={[styles.themeChip, mode === 'light' && styles.themeChipActive]}
            android_ripple={{ color: colors.border }}
          >
            <Text style={[styles.themeChipText, mode === 'light' && styles.themeChipTextActive]}>Light</Text>
          </Pressable>
          <Pressable
            onPress={() => onThemeChoice('dark')}
            style={[styles.themeChip, mode === 'dark' && styles.themeChipActive]}
            android_ripple={{ color: colors.border }}
          >
            <Text style={[styles.themeChipText, mode === 'dark' && styles.themeChipTextActive]}>Dark</Text>
          </Pressable>
        </View>

        <Text style={styles.label}>Shop name</Text>
        <TextInput
          value={shopName}
          onChangeText={setShopName}
          placeholder="MCA Phone Wala"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
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

        <Text style={[styles.label, styles.labelSpaced]}>Shop logo</Text>
        <View style={styles.logoCard}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoPreview} contentFit="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoPlaceholderText}>No logo</Text>
            </View>
          )}
          <View style={styles.logoActions}>
            <Pressable
              onPress={() => void onPickLogo()}
              disabled={logoBusy}
              style={[styles.secondaryBtn, logoBusy && styles.btnDisabled]}
              android_ripple={{ color: colors.border }}
            >
              <Text style={styles.secondaryBtnText}>{logoUri ? 'Change logo' : 'Choose logo'}</Text>
            </Pressable>
            {logoUri ? (
              <Pressable
                onPress={() => void onRemoveLogo()}
                disabled={logoBusy}
                style={[styles.dangerBtn, logoBusy && styles.btnDisabled]}
                android_ripple={{ color: colors.border }}
              >
                <Text style={styles.dangerBtnText}>Remove</Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        <Text style={[styles.label, styles.labelSpaced]}>Account</Text>
        <Text style={styles.accountEmail} selectable>
          {user?.email ?? '—'}
        </Text>
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
