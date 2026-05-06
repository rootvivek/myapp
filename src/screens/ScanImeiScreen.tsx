import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BarcodeScanningResult } from 'expo-camera';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';
import { imeiDigitsFromBarcodeData } from '../utils/imeiFromBarcode';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanImei'>;

const BARCODE_TYPES = [
  'code128',
  'code39',
  'ean13',
  'ean8',
  'upc_a',
  'upc_e',
  'qr',
  'datamatrix',
  'pdf417',
] as const;

function createStyles(colors: AppColors) {
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
    muted: {
      color: colors.textMuted,
      textAlign: 'center',
    },
    info: {
      color: colors.text,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 22,
    },
    primaryBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      borderRadius: radius.md,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    linkBtn: {
      marginTop: spacing.md,
      alignItems: 'center',
      padding: spacing.sm,
    },
    linkText: {
      color: colors.accent,
      fontWeight: '600',
    },
    banner: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    bannerTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    bannerSub: {
      color: colors.textMuted,
      fontSize: 14,
      marginTop: 4,
    },
    camera: {
      flex: 1,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    cancelFooter: {
      padding: spacing.md,
      alignItems: 'center',
    },
    cancelText: {
      color: colors.textMuted,
      fontWeight: '600',
      fontSize: 16,
    },
  });
}

export function ScanImeiScreen({ navigation, route }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const doneRef = useRef(false);

  const onBarcodeScanned = useCallback(
    (result: BarcodeScanningResult) => {
      if (doneRef.current) return;
      const imei = imeiDigitsFromBarcodeData(result.data ?? '');
      if (!imei) return;
      doneRef.current = true;
      navigation.navigate('AddRepair', {
        repairId: route.params?.repairId,
        scannedImei: imei,
      });
    },
    [navigation, route.params?.repairId]
  );

  if (!permission) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.muted}>Checking camera…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <Text style={styles.info}>Camera access is needed to scan IMEI barcodes.</Text>
          <Pressable onPress={() => void requestPermission()} style={styles.primaryBtn}>
            <Text style={styles.primaryText}>Allow camera</Text>
          </Pressable>
          <Pressable onPress={() => navigation.goBack()} style={styles.linkBtn}>
            <Text style={styles.linkText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Scan IMEI barcode</Text>
        <Text style={styles.bannerSub}>Aim at the sticker or box barcode. We read digits only (8–15).</Text>
      </View>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [...BARCODE_TYPES],
        }}
        onBarcodeScanned={onBarcodeScanned}
      />
      <Pressable onPress={() => navigation.goBack()} style={styles.cancelFooter} android_ripple={{ color: colors.border }}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
}
