import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { X } from 'lucide-react-native';

import { AppButton } from '../components/ui/AppButton';
import { AppIconButton } from '../components/ui/AppIconButton';
import { useTheme } from '../context/ThemeContext';
import { useRepairsState } from '../context/RepairsContext';
import type { RootStackParamList } from '../navigation/types';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ScanQr'>;

function createStyles(colors: AppColors): ReturnType<typeof StyleSheet.create> {
  return StyleSheet.create({
    safe: {
      flex: 1,
      // Camera background stays black in both modes so no light-coloured
      // frame flashes around the preview.
      backgroundColor: '#000',
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
      width: 280,
      height: 120,
      borderWidth: 2.5,
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
      paddingHorizontal: spacing.xl,
      lineHeight: 20,
    },
    closeBtn: {
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    permissionView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
      backgroundColor: colors.bg,
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

export function ScanQrScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [scanned, setScanned] = useState(false);
  const { repairs } = useRepairsState();

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['code-128', 'code-39', 'qr'],
    onCodeScanned: (codes) => {
      if (scanned) return;
      for (const code of codes) {
        const value = code.value?.trim();
        if (!value) continue;

        // Try matching scanned value against repair codes (case-insensitive)
        const match = repairs.find((r) => {
          const vLower = value.toLowerCase();
          const codeLower = r.orderCode.toLowerCase();
          // Matches 'ord00005' or raw ID '5'
          return (
            codeLower === vLower ||
            String(r.id) === value ||
            codeLower === `ord${vLower.replace(/\D/g, '').padStart(5, '0')}`
          );
        });

        if (match) {
          setScanned(true);
          navigation.replace('RepairDetail', { repairId: match.id });
          return;
        } else {
          setScanned(true);
          Alert.alert(
            'Job Not Found',
            `No repair order found matching "${value}".`,
            [{ text: 'Try Again', onPress: () => setScanned(false) }]
          );
          return;
        }
      }
    },
  });

  if (!hasPermission) {
    return (
      <View style={styles.permissionView}>
        <Text style={styles.permissionText}>
          Camera permission is needed to scan repair barcodes.
        </Text>
        <AppButton variant="primary" onPress={requestPermission}>
          Grant Permission
        </AppButton>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.permissionView}>
        <Text style={styles.permissionText}>No back camera found on this device.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AppIconButton
        variant="ghost"
        size={44}
        icon={<X size={20} color="#fff" />}
        onPress={() => navigation.goBack()}
        accessibilityLabel="Close scanner"
        containerStyle={styles.closeBtn}
      />

      <Camera
        style={styles.camera}
        device={device}
        isActive
        codeScanner={codeScanner}
      />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point camera at the receipt barcode to open the repair status</Text>
      </View>
    </SafeAreaView>
  );
}
