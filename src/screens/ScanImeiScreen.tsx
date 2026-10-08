import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

import { AppButton } from '../components/ui/AppButton';
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
    camera: {
      flex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    frame: {
      width: 260,
      height: 180,
      borderWidth: 2,
      borderColor: colors.accent,
      borderRadius: radius.lg,
      backgroundColor: 'transparent',
    },
    hint: {
      // Always white: the hint sits on top of the camera preview.
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    cancelBtn: {
      position: 'absolute',
      bottom: 60,
      alignSelf: 'center',
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    permissionView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    permissionText: {
      color: colors.text,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 24,
    },
  });
}

const CODE_TYPES = ['code-128', 'code-39', 'ean-13', 'ean-8', 'qr', 'codabar', 'itf', 'upc-e'] as const;

export function ScanImeiScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [scanned, setScanned] = useState(false);

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: [...CODE_TYPES],
    onCodeScanned: (codes) => {
      if (scanned) return;
      for (const code of codes) {
        const value = code.value;
        if (!value) continue;
        // Extract digits only, max 15
        const digits = value.replace(/\D/g, '').slice(0, 15);
        if (digits.length >= 8) {
          setScanned(true);
          // Go back to AddRepair and merge the scanned IMEI into its params.
          // Using goBack() preserves the existing AddRepair form state.
          navigation.navigate({
            name: 'AddRepair',
            params: { scannedImei: digits },
            merge: true,
          } as any);
          return;
        }
      }
    },
  });

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.permissionView}>
          <Text style={styles.permissionText}>
            Camera permission is needed to scan IMEI barcodes.
          </Text>
          <AppButton variant="primary" onPress={requestPermission}>
            Grant Permission
          </AppButton>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.permissionView}>
          <Text style={styles.permissionText}>No camera found on this device.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Camera
        style={styles.camera}
        device={device}
        isActive
        codeScanner={codeScanner}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point camera at the IMEI barcode</Text>
      </View>

      <AppButton
        variant="tertiary"
        onPress={() => navigation.goBack()}
        containerStyle={styles.cancelBtn}
        labelStyle={{ color: '#FFFFFF', fontWeight: '700' }}
      >
        Cancel
      </AppButton>
    </SafeAreaView>
  );
}
