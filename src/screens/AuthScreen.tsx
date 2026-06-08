import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';
import { isValidEmail, normalizeEmail } from '../utils/email';

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    flex: {
      flex: 1,
    },
    scroll: {
      padding: spacing.lg,
      paddingBottom: spacing.xl,
    },
    centered: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
    },
    brand: {
      color: colors.text,
      fontSize: 26,
      fontWeight: '800',
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    muted: {
      color: colors.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 16,
      marginBottom: spacing.md,
    },
    primary: {
      backgroundColor: colors.accent,
      paddingVertical: 16,
      borderRadius: radius.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    primaryText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '800',
    },
    dim: { opacity: 0.75 },
    switchBtn: {
      padding: spacing.md,
      alignItems: 'center',
    },
    switchText: {
      color: colors.accent,
      fontWeight: '700',
      fontSize: 15,
    },
  });
}

export function AuthScreen() {
  const { configured, signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    let rawInput = email.trim();
    // If input doesn't contain '@', treat it as a username and append '@shop.com'
    if (rawInput && !rawInput.includes('@')) {
      rawInput = `${rawInput.toLowerCase()}@shop.com`;
    }
    const e = normalizeEmail(rawInput);
    if (!e || !password) {
      Alert.alert('Missing fields', 'Enter username/email and password.');
      return;
    }
    if (!isValidEmail(e)) {
      Alert.alert(
        'Credentials',
        'Use a valid username or email address.'
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password', 'Use at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(e, password);
      } else {
        const res = await signUp(e, password);
        if (res?.needsEmailConfirm) {
          Alert.alert(
            'Confirm email',
            'Check your inbox and confirm your email, then sign in here.'
          );
          setMode('signin');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert(mode === 'signin' ? 'Sign in failed' : 'Sign up failed', msg);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.title}>Cloud not configured</Text>
          <Text style={styles.muted}>
            Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file in the project root, run the SQL
            in supabase/schema.sql in your Supabase project, create the repair-images storage bucket, then restart Expo.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.brand}>MCA Phone Wala</Text>
          <Text style={styles.subtitle}>Sign in to sync jobs in the cloud</Text>

          <Text style={styles.label}>Username or Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="e.g. rahul123 or you@example.com"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />

          <Pressable
            onPress={() => void onSubmit()}
            disabled={busy}
            style={[styles.primary, busy && styles.dim]}
            android_ripple={{ color: '#fff' }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryText}>{mode === 'signin' ? 'Sign in' : 'Create account'}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            style={styles.switchBtn}
            disabled={busy}
          >
            <Text style={styles.switchText}>
              {mode === 'signin' ? 'Need an account? Sign up' : 'Have an account? Sign in'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
