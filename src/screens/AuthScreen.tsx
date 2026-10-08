import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogIn, ShieldAlert, UserPlus, Wrench } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTab } from '../context/TabContext';
import type { AppColors } from '../theme';
import { radius, sizes, spacing } from '../theme';
import { normalizePhone, sendOtp, verifyOtp } from '../services/msg91Service';
import { AppButton } from '../components/ui/AppButton';
import { AppInput, type AppInputRef } from '../components/ui/AppInput';

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
      borderWidth: sizes.hairline,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 2,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    logoContainer: {
      width: 58,
      height: 58,
      borderRadius: radius.lg,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.md,
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 2,
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
      padding: spacing.xs,
      marginBottom: spacing.lg,
      borderWidth: sizes.hairline,
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
      shadowOpacity: 0.12,
      shadowRadius: 4,
      elevation: 1,
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
    primaryBtnWrapper: {
      marginTop: spacing.md,
    },
    dim: {
      opacity: 0.65,
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
      borderWidth: sizes.hairline,
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
    homeBtnLayer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backToHomeText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '700',
      textDecorationLine: 'underline',
    },
  });
}

export function AuthScreen() {
  const { configured, signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { setActiveTab } = useTab();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [signupStep, setSignupStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'phone' | 'otp' | 'name' | 'shopName' | 'password', string>>>({});
  const phoneRef = useRef<AppInputRef>(null);
  const otpRef = useRef<AppInputRef>(null);
  const nameRef = useRef<AppInputRef>(null);
  const shopNameRef = useRef<AppInputRef>(null);
  const passwordRef = useRef<AppInputRef>(null);

  function focusAuthField(field: 'phone' | 'otp' | 'name' | 'shopName' | 'password') {
    const refs = { phone: phoneRef, otp: otpRef, name: nameRef, shopName: shopNameRef, password: passwordRef };
    setTimeout(() => refs[field].current?.focus(), 100);
  }

  function showAuthValidation(field: 'phone' | 'otp' | 'name' | 'shopName' | 'password', message: string) {
    setFieldErrors((current) => ({ ...current, [field]: message }));
    focusAuthField(field);
  }

  function clearFieldError(field: 'phone' | 'otp' | 'name' | 'shopName' | 'password') {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function resetSignupFlow(keepPhone = false) {
    setName('');
    setShopName('');
    if (!keepPhone) setPhone('');
    setOtp('');
    setPassword('');
    setOtpSent(false);
    setSignupStep('phone');
    setFieldErrors({});
  }

  async function requestOtp() {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone || normalizedPhone.length < 10) {
      showAuthValidation('phone', 'Enter a valid mobile number.');
      return;
    }

    setBusy(true);
    try {
      const result = await sendOtp(normalizedPhone);
      if (!result.ok) {
        Alert.alert('OTP failed', result.message);
        return;
      }

      setOtpSent(true);
      if (result.verified) {
        setSignupStep('details');
        Alert.alert('OTP verified', 'Now add your name and shop name.');
        return;
      }

      setSignupStep('otp');
      Alert.alert('OTP sent', result.message);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit() {
    if (mode === 'signup') {
      const normalizedPhone = normalizePhone(phone);

      if (signupStep === 'otp') {
        if (!normalizedPhone || normalizedPhone.length < 10) {
          showAuthValidation('phone', 'Enter a valid mobile number.');
          return;
        }
        if (!otpSent) {
          Alert.alert('OTP required', 'Request an OTP before continuing.');
          return;
        }
        if (!otp.trim()) {
          showAuthValidation('otp', 'Enter the OTP you received on your phone.');
          return;
        }

        setBusy(true);
        try {
          const verified = await verifyOtp(otp);
          if (!verified.ok) {
            Alert.alert('OTP invalid', verified.message);
            return;
          }

          setSignupStep('details');
          Alert.alert('OTP verified', 'Now add your name and shop name.');
        } finally {
          setBusy(false);
        }
        return;
      }

      if (!name.trim()) {
        showAuthValidation('name', 'Please enter your name.');
        return;
      }
      if (!shopName.trim()) {
        showAuthValidation('shopName', 'Please enter your shop name.');
        return;
      }
      if (!normalizedPhone || normalizedPhone.length < 10) {
        showAuthValidation('phone', 'Enter a valid mobile number.');
        return;
      }
      if (!password || password.length < 6) {
        showAuthValidation('password', 'Set a password with at least 6 characters.');
        return;
      }

      setBusy(true);
      try {
        const signupResult = await signUp(
          normalizedPhone,
          password,
          name.trim(),
          shopName.trim()
        );
        if (signupResult.needsPhoneConfirm) {
          Alert.alert(
            'Email confirmation is blocking signup',
            'Your account and shop were created, but Supabase did not return a sign-in session. Open Supabase Dashboard → Authentication → Providers → Email and turn OFF "Confirm email", then sign in with your phone number and password.'
          );
          resetSignupFlow(true);
          setMode('signin');
          return;
        }
        Alert.alert(
          'Account created',
          'Your account is ready. Sign in with your phone number and password.'
        );
        resetSignupFlow(true);
        setMode('signin');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Something went wrong.';
        Alert.alert('Sign up failed', msg);
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!phone.trim() || !password) {
      showAuthValidation(
        !phone.trim() ? 'phone' : 'password',
        !phone.trim() ? 'Enter your email or phone number.' : 'Enter your password.'
      );
      return;
    }

    setBusy(true);
    try {
      await signIn(phone.trim(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong.';
      Alert.alert('Sign in failed', msg);
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.scrollContent}>
          <View style={styles.unconfiguredCard}>
            <View style={[styles.logoContainer, { backgroundColor: colors.warning }]}>
              <ShieldAlert size={28} color="#FFFFFF" />
            </View>
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
            <View style={[styles.logoContainer, { backgroundColor: colors.accent }]}>
              <Wrench size={28} color="#FFFFFF" strokeWidth={2.2} />
            </View>
              <Text style={styles.appName}>MCA Phonewala</Text>
              <Text style={styles.appSubtitle}>Phone Repair & Store Management</Text>
            </View>

            {/* Segmented Mode Switcher */}
            <View style={styles.tabContainer}>
              <Pressable
                style={[styles.tabBtn, mode === 'signin' && styles.activeTabBtn]}
                onPress={() => {
                  setMode('signin');
                  setFieldErrors({});
                  setSignupStep('phone');
                  setOtpSent(false);
                }}
                disabled={busy}
              >
                <Text style={[styles.tabText, mode === 'signin' && styles.activeTabText]}>
                  Sign In
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tabBtn, mode === 'signup' && styles.activeTabBtn]}
                onPress={() => {
                  setMode('signup');
                  setFieldErrors({});
                  setSignupStep('phone');
                  setOtpSent(false);
                }}
                disabled={busy}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>
                  Create Account
                </Text>
              </Pressable>
            </View>

            {/* Form Fields */}
            {mode === 'signup' && signupStep === 'details' && (
              <>
                <AppInput
                  containerStyle={styles.fieldGroup}
                  ref={nameRef}
                  label="Full Name"
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    clearFieldError('name');
                  }}
                  autoCapitalize="words"
                  placeholder="Enter your full name"
                  editable={!busy}
                  error={fieldErrors.name}
                />

                <AppInput
                  containerStyle={styles.fieldGroup}
                  ref={shopNameRef}
                  label="Shop Name"
                  value={shopName}
                  onChangeText={(value) => {
                    setShopName(value);
                    clearFieldError('shopName');
                  }}
                  autoCapitalize="words"
                  placeholder="Enter your shop name"
                  editable={!busy}
                  error={fieldErrors.shopName}
                />
              </>
            )}

            {mode === 'signup' ? (
              signupStep === 'phone' || signupStep === 'otp' ? (
                <AppInput
                  containerStyle={styles.fieldGroup}
                  ref={phoneRef}
                  label="Phone Number"
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(value);
                    clearFieldError('phone');
                  }}
                  autoCapitalize="none"
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  placeholder="Enter your phone number"
                  editable={!busy && signupStep === 'phone'}
                  error={fieldErrors.phone}
                />
              ) : (
                <AppInput
                  containerStyle={styles.fieldGroup}
                  ref={phoneRef}
                  label="Phone Number"
                  value={phone}
                  editable={false}
                  error={fieldErrors.phone}
                />
              )
            ) : (
              <AppInput
                containerStyle={styles.fieldGroup}
                ref={phoneRef}
                label="Email or Phone Number"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value);
                  clearFieldError('phone');
                }}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Enter email or phone number"
                editable={!busy}
                error={fieldErrors.phone}
              />
            )}

            {mode === 'signup' && signupStep === 'otp' && (
              <AppInput
                containerStyle={styles.fieldGroup}
                ref={otpRef}
                label="OTP"
                value={otp}
                onChangeText={(value) => {
                  setOtp(value);
                  clearFieldError('otp');
                }}
                keyboardType="number-pad"
                placeholder="Enter OTP"
                editable={!busy}
                error={fieldErrors.otp}
              />
            )}

            {mode === 'signup' && signupStep === 'phone' && (
              <View style={[styles.primaryBtnWrapper, busy && styles.dim]}>
                <AppButton
                  fullWidth
                  loading={busy}
                  disabled={busy}
                  onPress={() => void requestOtp()}
                  accessibilityLabel={otpSent ? 'Resend OTP' : 'Send OTP'}
                >
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </AppButton>
              </View>
            )}

            {mode === 'signup' && signupStep === 'otp' && (
              <View style={[styles.primaryBtnWrapper, busy && styles.dim]}>
                <AppButton
                  fullWidth
                  loading={busy}
                  disabled={busy}
                  onPress={() => void onSubmit()}
                  accessibilityLabel="Verify OTP"
                >
                  Verify OTP
                </AppButton>
              </View>
            )}

            {(mode === 'signin' || signupStep === 'details') && (
              <AppInput
                containerStyle={styles.fieldGroup}
                ref={passwordRef}
                label="Password"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  clearFieldError('password');
                }}
                secureTextEntry={!showPassword}
                placeholder={mode === 'signin' ? 'Enter your password' : 'Set a password'}
                editable={!busy}
                error={fieldErrors.password}
                rightAction={{
                  label: showPassword ? 'Hide' : 'Show',
                  onPress: () => setShowPassword((prev) => !prev),
                  accessibilityLabel: showPassword ? 'Hide password' : 'Show password',
                }}
              />
            )}

            {/* Submit Button */}
            {(mode === 'signin' || signupStep === 'details') && (
              <View style={[styles.primaryBtnWrapper, busy && styles.dim]}>
                <AppButton
                  fullWidth
                  loading={busy}
                  disabled={busy}
                  onPress={() => void onSubmit()}
                  leftIcon={
                    mode === 'signin' ? (
                      <LogIn size={18} color="#FFFFFF" strokeWidth={2.4} />
                    ) : (
                      <UserPlus size={18} color="#FFFFFF" strokeWidth={2.4} />
                    )
                  }
                  accessibilityLabel={mode === 'signin' ? 'Sign In' : 'Create Account'}
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </AppButton>
              </View>
            )}

            {/* Bottom Quick Switch */}
            <Pressable
              onPress={() => {
                if (mode === 'signin') {
                  setMode('signup');
                  resetSignupFlow();
                } else {
                  setMode('signin');
                  resetSignupFlow();
                }
              }}
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

      {/* ── Back to home link (bottom center) ── */}
      <View
        pointerEvents="auto"
        style={[
          styles.homeBtnLayer,
          { bottom: Math.max(insets.bottom, spacing.lg) },
        ]}
      >
        <Pressable
          onPress={() => setActiveTab('home')}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
        >
          <Text style={styles.backToHomeText}>Back to home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

