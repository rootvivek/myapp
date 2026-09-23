import { useMemo, useRef, useState } from 'react';
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
import { Eye, EyeOff, Lock, LogIn, Mail, Phone, ShieldAlert, Store, User, UserPlus, Wrench } from 'lucide-react-native';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';
import { normalizePhone, sendOtp, verifyOtp } from '../services/msg91Service';

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
    inputError: {
      borderColor: '#DC2626',
    },
    errorText: {
      color: '#DC2626',
      fontSize: 12,
      marginTop: 5,
      marginLeft: 4,
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
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [signupStep, setSignupStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'phone' | 'otp' | 'name' | 'shopName' | 'password', string>>>({});
  const phoneRef = useRef<TextInput>(null);
  const otpRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const shopNameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

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
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Full Name</Text>
                  <View style={[styles.inputContainer, fieldErrors.name && styles.inputError]}>
                    <User size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      ref={nameRef}
                      value={name}
                      onChangeText={(value) => {
                        setName(value);
                        clearFieldError('name');
                      }}
                      autoCapitalize="words"
                      placeholder="Enter your full name"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      editable={!busy}
                    />
                  </View>
                  {fieldErrors.name && <Text style={styles.errorText}>{fieldErrors.name}</Text>}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Shop Name</Text>
                  <View style={[styles.inputContainer, fieldErrors.shopName && styles.inputError]}>
                    <Store size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      ref={shopNameRef}
                      value={shopName}
                      onChangeText={(value) => {
                        setShopName(value);
                        clearFieldError('shopName');
                      }}
                      autoCapitalize="words"
                      placeholder="Enter your shop name"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      editable={!busy}
                    />
                  </View>
                  {fieldErrors.shopName && <Text style={styles.errorText}>{fieldErrors.shopName}</Text>}
                </View>
              </>
            )}

            {mode === 'signup' ? (
              signupStep === 'phone' || signupStep === 'otp' ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputContainer, fieldErrors.phone && styles.inputError]}>
                    <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      ref={phoneRef}
                      value={phone}
                      onChangeText={(value) => {
                        setPhone(value);
                        clearFieldError('phone');
                      }}
                      autoCapitalize="none"
                      autoComplete="tel"
                      keyboardType="phone-pad"
                      placeholder="Enter your phone number"
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                      editable={!busy && signupStep === 'phone'}
                    />
                  </View>
                  {fieldErrors.phone && <Text style={styles.errorText}>{fieldErrors.phone}</Text>}
                </View>
              ) : (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputContainer, fieldErrors.phone && styles.inputError]}>
                    <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      ref={phoneRef}
                      value={phone}
                      style={styles.input}
                      editable={false}
                    />
                  </View>
                  {fieldErrors.phone && <Text style={styles.errorText}>{fieldErrors.phone}</Text>}
                </View>
              )
            ) : (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email or Phone Number</Text>
                <View style={[styles.inputContainer, fieldErrors.phone && styles.inputError]}>
                  {phone.includes('@') ? (
                    <Mail size={18} color={colors.textMuted} style={styles.inputIcon} />
                  ) : (
                    <Phone size={18} color={colors.textMuted} style={styles.inputIcon} />
                  )}
                  <TextInput
                    ref={phoneRef}
                    value={phone}
                    onChangeText={(value) => {
                      setPhone(value);
                      clearFieldError('phone');
                    }}
                    autoCapitalize="none"
                    autoComplete="email"
                    keyboardType="email-address"
                    placeholder="Enter email or phone number"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    editable={!busy}
                  />
                </View>
                {fieldErrors.phone && <Text style={styles.errorText}>{fieldErrors.phone}</Text>}
              </View>
            )}

            {mode === 'signup' && signupStep === 'otp' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>OTP</Text>
                <View style={[styles.inputContainer, fieldErrors.otp && styles.inputError]}>
                  <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={otpRef}
                    value={otp}
                    onChangeText={(value) => {
                      setOtp(value);
                      clearFieldError('otp');
                    }}
                    keyboardType="number-pad"
                    placeholder="Enter OTP"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    editable={!busy}
                  />
                </View>
                {fieldErrors.otp && <Text style={styles.errorText}>{fieldErrors.otp}</Text>}
              </View>
            )}

            {mode === 'signup' && signupStep === 'phone' && (
              <View style={[styles.primaryBtnWrapper, busy && styles.dim]}>
                <Pressable
                  onPress={() => void requestOtp()}
                  disabled={busy}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryText}>{otpSent ? 'Resend OTP' : 'Send OTP'}</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {mode === 'signup' && signupStep === 'otp' && (
              <View style={[styles.primaryBtnWrapper, busy && styles.dim]}>
                <Pressable
                  onPress={() => void onSubmit()}
                  disabled={busy}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                >
                  <LinearGradient
                    colors={['#10B981', '#059669']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryText}>Verify OTP</Text>
                  </LinearGradient>
                </Pressable>
              </View>
            )}

            {(mode === 'signin' || signupStep === 'details') && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputContainer, fieldErrors.password && styles.inputError]}>
                  <Lock size={18} color={colors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    ref={passwordRef}
                    value={password}
                    onChangeText={(value) => {
                      setPassword(value);
                      clearFieldError('password');
                    }}
                    secureTextEntry={!showPassword}
                    placeholder={mode === 'signin' ? 'Enter your password' : 'Set a password'}
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
                {fieldErrors.password && <Text style={styles.errorText}>{fieldErrors.password}</Text>}
              </View>
            )}

            {/* Submit Button */}
            {(mode === 'signin' || signupStep === 'details') && (
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
                          {mode === 'signin'
                            ? 'Sign In'
                            : 'Create Account'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </Pressable>
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
    </SafeAreaView>
  );
}

