import { SecureImage } from './SecureImage';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../context/ThemeContext';
import type { AppColors } from '../theme';
import { radius, spacing } from '../theme';
import { launchCameraForImage, launchLibraryForImage } from '../utils/pickImage';

type Props = {
  label: string;
  uri: string;
  onChange: (uri: string) => void;
  /** Full-width square (rare); default is half row like other pair cells. */
  fullWidth?: boolean;
  style?: ViewStyle;
};

const layoutStyles = StyleSheet.create({
  pairRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  pairSpacer: {
    flex: 1,
    minWidth: 0,
  },
});

function createCellStyles(colors: AppColors) {
  const styles = StyleSheet.create({
    cell: {
      flex: 1,
      minWidth: 0,
    },
    cellFull: {
      width: '100%',
      flex: undefined,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      marginBottom: 8,
      fontWeight: '500',
    },
    previewHit: {
      borderRadius: radius.md,
      overflow: 'hidden',
      width: '100%',
    },
    preview: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: radius.md,
      backgroundColor: colors.surface2,
    },
    placeholder: {
      width: '100%',
      aspectRatio: 1,
      borderRadius: radius.md,
      backgroundColor: colors.surface2,
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    placeholderText: {
      color: colors.textMuted,
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
      paddingHorizontal: 4,
    },
    placeholderHint: {
      color: colors.textMuted,
      fontSize: 9,
      marginTop: 4,
      textAlign: 'center',
      paddingHorizontal: 4,
      opacity: 0.85,
    },
  });

  return styles as typeof styles & {
    preview: import('react-native').ImageStyle;
  };
}

export function RepairImageSlotCell({ label, uri, onChange, fullWidth, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createCellStyles(colors), [colors]);

  function openCamera() {
    void launchCameraForImage().then((u) => u && onChange(u));
  }

  function openMoreOptions() {
    const buttons: {
      text: string;
      style?: 'destructive' | 'cancel';
      onPress?: () => void;
    }[] = [
        {
          text: 'Photo library',
          onPress: () => void launchLibraryForImage().then((u) => u && onChange(u)),
        },
      ];
    if (uri) {
      buttons.push({
        text: 'Remove',
        style: 'destructive',
        onPress: () => onChange(''),
      });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(label, 'Other options', buttons);
  }

  return (
    <View style={[styles.cell, fullWidth && styles.cellFull, style]}>
      <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">{label}</Text>
      <Pressable
        onPress={openCamera}
        onLongPress={openMoreOptions}
        delayLongPress={380}
        style={styles.previewHit}
        android_ripple={{ color: colors.border }}
      >
        {uri ? (
          <SecureImage source={{ uri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Tap: camera</Text>
            <Text style={styles.placeholderHint}>Hold: gallery</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

/** Two equal columns: left | right (e.g. front & back, or ID 1 & ID 2). */
export function RepairImagePairRow({ children }: { children: ReactNode }) {
  return <View style={layoutStyles.pairRow}>{children}</View>;
}

/** Empty second column so a single cell stays the same width as front/back (half row). */
export function RepairImagePairSpacer() {
  return <View style={layoutStyles.pairSpacer} />;
}
