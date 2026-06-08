import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanImei'>;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      padding: spacing.lg,
    },
    title: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
      marginBottom: 8,
    },
    info: {
      color: colors.textMuted,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    input: {
      backgroundColor: colors.surface2,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 14,
      color: colors.text,
      fontSize: 18,
      letterSpacing: 1.5,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    primaryBtnDisabled: {
      opacity: 0.5,
    },
    primaryText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    cancelBtn: {
      marginTop: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    cancelText: {
      color: colors.accent,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}

export function ScanImeiScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [imeiText, setImeiText] = useState('');

  const digits = imeiText.replace(/\D/g, '').slice(0, 15);
  const isValid = digits.length >= 8;

  function handleSubmit() {
    if (!isValid) return;
    navigation.navigate('AddRepair', { scannedImei: digits });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.centered}>
        <Text style={styles.title}>Enter IMEI</Text>
        <Text style={styles.info}>
          Type the IMEI number from the device box label (8–15 digits).
        </Text>
        <TextInput
          placeholder="IMEI digits"
          placeholderTextColor={colors.textMuted}
          value={digits}
          onChangeText={setImeiText}
          keyboardType="number-pad"
          maxLength={15}
          style={styles.input}
          autoFocus
        />
        <Pressable
          onPress={handleSubmit}
          style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
          disabled={!isValid}
        >
          <Text style={styles.primaryText}>Use This IMEI</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
