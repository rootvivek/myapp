import { StyleSheet } from 'react-native';

import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';

export function createScanImeiStyles(colors: AppColors) {
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
    // Camera overlays intentionally stay light for contrast against the preview.
    hint: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
      marginTop: spacing.lg,
      textAlign: 'center',
    },
    cancelBtn: {
      position: 'absolute',
      bottom: 60,
      alignSelf: 'center',
      backgroundColor: 'rgba(0,0,0,0.55)',
    },
    cancelLabel: {
      color: '#FFFFFF',
      fontWeight: '700',
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