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
import LinearGradient from 'react-native-linear-gradient';
import { Eye, EyeOff, Lock, LogIn, Mail, ShieldAlert, User, UserPlus, Wrench } from 'lucide-react-native';

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
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 6,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    logoContainer: {
      width: 58,
      height: 58,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 5,
    },
    appName: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      letterSpacing: -0.4,
      textAlign: 'center',
    },
    appSubtitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
      marginTop: 2,
      textAlign: 'center',
    },
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface2,
      borderRadius: radius.lg,
      padding: 4,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTabBtn: {
      backgroundColor: colors.accent,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
    },
    activeTabText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    fieldGroup: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      opacity: 0.85,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface2,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      minHeight: 50,
    },
    inputIcon: {
      marginRight: spacing.sm,
    },
    input: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    },
    eyeBtn: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
    },
    primaryBtnWrapper: {
      borderRadius: radius.lg,
      overflow: 'hidden',
      marginTop: spacing.md,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    primaryBtn: {
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    dim: {
      opacity: 0.65,
    },
    primaryText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
      letterSpacing: 0.3,
    },
    switchBtn: {
      marginTop: spacing.lg,
      alignItems: 'center',
      paddingVertical: spacing.xs,
    },
    switchText: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '500',
    },
    switchTextHighlight: {
      color: colors.accent,
      fontWeight: '700',
    },
    unconfiguredCard: {
      width: '100%',
      maxWidth: 420,
      backgroundColor: colors.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.xl,
      alignItems: 'center',
    },
    unconfiguredTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginTop: spacing.md,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    unconfiguredText: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 19,
      textAlign: 'center',
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
  const [showPassword, setShowPassword] = useState(false);
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
        <LinearGradient
          colors={colors.bgGradient}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.scrollContent}>
          <View style={styles.unconfiguredCard}>
            <LinearGradient
              colors={[colors.warning, '#F97316']}
              style={styles.logoContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ShieldAlert size={28} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.unconfiguredTitle}>Cloud Not Configured</Text>
            <Text style={styles.unconfiguredText}>
              Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file, run supabase/schema.sql, create the repair-images bucket, and restart the app.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Background Gradient */}
      <LinearGradient
        colors={colors.bgGradient}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Centered Login Card */}
          <View style={styles.card}>
            {/* Header / Brand */}
            <View style={styles.header}>
              <LinearGradient
                colors={['#8B5CF6', '#6366F1']}
                style={styles.logoContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Wrench size={28} color="#FFFFFF" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={styles.appName}>MCA Phonewala</Text>
              <Text style={styles.appSubtitle}>Phone Repair & Store Management</Text>
            </View>

            {/* Segmented Mode Switcher */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[styles.tabBtn, mode === 'signin' && styles.activeTabBtn]}
                onPress={() => setMode('signin')}
                disabled={busy}
              >
                <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, mode === 'signup' && styles.activeTabBtn]}
                onPress={() => setMode('signup')}
                disabled={busy}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                  Create Account
                </Text>
              </Pressable>
            </View>

            {/* Form Fields */}
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputContainer}>
                  <User size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    editable={!busy}
                  />
                </View>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Username or Email</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  placeholder="Username or email"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  editable={!busy}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  editable={!busy}
                />
                <Pressable
                  onPress={() => setShowPassword(prev => !prev)}
                  style={styles.eyeBtn}
                  hitSlop={8}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={colors.textMuted} />
                  ) : (
                    <Eye size={18} color={colors.textMuted} />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Submit Button */}
            <View style={[styles.primaryBtnWrapper, busy && styles.dim]}>
              <Pressable
                onPress={() => void onSubmit()}
                disabled={busy}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryBtn}
                >
                  {busy ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      {mode === 'signin' ? (
                        <LogIn size={18} color="#FFFFFF" strokeWidth={2.4} />
                      ) : (
                        <UserPlus size={18} color="#FFFFFF" strokeWidth={2.4} />
                      )}
                      <Text style={styles.primaryText}>
                        {mode === 'signin' ? 'Sign In' : 'Create Account'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* Bottom Quick Switch */}
            <Pressable
              onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              style={styles.switchBtn}
              disabled={busy}
            >
              <Text style={styles.switchText}>
                {mode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <Text style={styles.switchTextHighlight}>Sign Up</Text>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <Text style={styles.switchTextHighlight}>Sign In</Text>
                  </>
                )}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

