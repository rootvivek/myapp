import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';

export function createScanQrStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      // Keep the camera surface black in both modes to avoid a light flash.
      backgroundColor: '#000000',
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
    // Camera overlays intentionally stay light for contrast against the preview.
    hint: {
      color: '#FFFFFF',
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