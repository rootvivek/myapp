import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';

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
      borderColor: '#8B5CF6',
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    hint: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 20,
      textAlign: 'center',
    },
    cancelBtn: {
      position: 'absolute',
      bottom: 60,
      alignSelf: 'center',
      paddingVertical: 14,
      paddingHorizontal: 40,
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 14,
    },
    cancelText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },
    permissionView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    permissionText: {
      color: colors.text,
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 24,
    },
    grantBtn: {
      backgroundColor: colors.accent,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 14,
    },
    grantBtnText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
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
          <Pressable onPress={requestPermission} style={styles.grantBtn} android_ripple={{ color: colors.border }}>
            <Text style={styles.grantBtnText}>Grant Permission</Text>
          </Pressable>
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

      <Pressable onPress={() => navigation.goBack()} style={styles.cancelBtn} android_ripple={{ color: 'rgba(255,255,255,0.1)' }}>
        <Text style={styles.cancelText}>Cancel</Text>
      </Pressable>
    </SafeAreaView>
  );
}
