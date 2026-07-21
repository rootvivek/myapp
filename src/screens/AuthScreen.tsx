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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    brand: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: 15,
      marginTop: spacing.xs,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: spacing.xs,
    },
    muted: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    label: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: spacing.xs,
      marginTop: spacing.md,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      fontSize: 16,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    primary: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    dim: {
      opacity: 0.6,
    },
    primaryText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    switchBtn: {
      marginTop: spacing.lg,
      alignItems: 'center',
      paddingVertical: spacing.sm,
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    if (mode === 'signup' && !name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    let rawInput = email.trim();
    if (rawInput && !rawInput.includes('@')) {
      if (rawInput.includes('.')) {
        rawInput = `${rawInput.toLowerCase()}@mcaphonewala.internal`;
      } else {
        rawInput = `${rawInput.toLowerCase()}@shop.com`;
      }
    }
    const e = normalizeEmail(rawInput);
    if (!e || !password) {
      Alert.alert('Missing fields', 'Enter username/email and password.');
      return;
    }
    if (!isValidEmail(e)) {
      Alert.alert('Credentials', 'Use a valid username or email address.');
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
        const res = await signUp(e, password, name.trim());
        if (res?.needsEmailConfirm) {
          Alert.alert('Confirm email', 'Check your inbox and confirm your email, then sign in here.');
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
          contentContainerStyle={[styles.scroll, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main centralized form content */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={[styles.subtitle, { fontWeight: '700', color: colors.accent, marginBottom: spacing.xxl }]}>
              Phone Repair & Store Management
            </Text>


            {mode === 'signup' && (
              <>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholder="Enter Your Name"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </>
            )}

            <Text style={styles.label}>Username or Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Enter Username or Email"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Enter Password"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <View style={{ height: spacing.md }} />
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
